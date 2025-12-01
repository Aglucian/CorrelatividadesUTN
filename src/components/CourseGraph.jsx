import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CourseNode from './CourseNode';

const nodeTypes = {
    course: CourseNode,
};

const getLayoutedElements = (nodes, edges) => {
    // Manual layout based on levels
    // Group nodes by level
    const levels = {};
    nodes.forEach(node => {
        const level = node.data.level || 1; // Default to level 1 if missing
        if (!levels[level]) levels[level] = [];
        levels[level].push(node);
    });

    const ROW_HEIGHT = 200; // Vertical spacing between rows
    const NODE_WIDTH = 180; // Approximate width of a node + gap
    const NODE_GAP = 20;

    const layoutedNodes = [];

    Object.keys(levels).forEach(levelKey => {
        const levelNodes = levels[levelKey];
        const levelIndex = parseInt(levelKey) - 1; // 0-based index

        // Calculate total width of this row to center it
        const rowWidth = levelNodes.length * NODE_WIDTH + (levelNodes.length - 1) * NODE_GAP;
        const startX = -rowWidth / 2;

        levelNodes.forEach((node, index) => {
            node.position = {
                x: startX + index * (NODE_WIDTH + NODE_GAP),
                y: levelIndex * ROW_HEIGHT
            };
            layoutedNodes.push(node);
        });
    });

    return { nodes: layoutedNodes, edges };
};

const CourseGraph = ({ courses, onCourseClick }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        if (!courses || courses.length === 0) return;

        // Create Nodes
        const initialNodes = courses.map((course) => ({
            id: course.id,
            type: 'course',
            data: {
                label: course.name,
                status: course.status,
                level: course.level,
                isAvailable: course.isAvailable
            },
            position: { x: 0, y: 0 },
        }));

        // Create Edges
        const initialEdges = [];
        courses.forEach((course) => {
            if (course.prerequisites) {
                course.prerequisites.forEach((prereqId) => {
                    // Check if prereq exists
                    if (courses.find(c => c.id === prereqId)) {
                        const sourceNode = courses.find(c => c.id === prereqId);

                        let edgeClass = '';
                        if (sourceNode) {
                            if (sourceNode.status === 'cursada') edgeClass = 'edge-cursada';
                            else if (sourceNode.status === 'final') edgeClass = 'edge-final';
                        }

                        const isAnimated = sourceNode && (sourceNode.status === 'final' || sourceNode.status === 'cursada');

                        initialEdges.push({
                            id: `e${prereqId}-${course.id}`,
                            source: prereqId,
                            target: course.id,
                            animated: isAnimated,
                            className: edgeClass,
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                            },
                            type: 'smoothstep'
                        });
                    }
                });
            }
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [courses, setNodes, setEdges]);

    const onNodeClick = useCallback((event, node) => {
        if (onCourseClick) {
            onCourseClick(node.id);
        }
    }, [onCourseClick]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                fitView
                proOptions={{ hideAttribution: true }}
                attributionPosition="bottom-right"
            >
                <Background color="#aaa" gap={16} />
                <Controls />
            </ReactFlow>
        </div>
    );
};

export default CourseGraph;
