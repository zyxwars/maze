export type Pos = {
  x: number;
  y: number;
};
type Node = {
  isVisited: boolean;
  throughPos: Pos | null;
  distance: number;
};

type Nodes = (Node | null)[][];

function createNode(tile: number) {
  // wall
  if (tile === 1) return null;

  return { isVisited: false, throughPos: null, distance: Infinity };
}

function getNode({ x, y }: Pos, nodes: Nodes, mazeSize: number) {
  if (x < 0) return null;
  if (y < 0) return null;

  if (x >= mazeSize) return null;
  if (y >= mazeSize) return null;

  return nodes[y][x];
}

function recalculateNode(node: Node, throughPos: Pos, throughDistance: number) {
  if (node.distance > throughDistance + 1) {
    node.distance = throughDistance + 1;
    node.throughPos = throughPos;
  }
}

export function calculatePath(maze: number[][], mazeSize: number) {
  let startPos: Pos | null = null;
  let endPos: Pos | null = null;

  let nodes: Nodes = [];
  for (let y = 0; y < mazeSize; y++) {
    nodes.push([]);
    for (let x = 0; x < mazeSize; x++) {
      if (maze[y][x] === 2) {
        startPos = { x, y };
      } else if (maze[y][x] === 3) {
        endPos = { x, y };
      }
      nodes[y].push(createNode(maze[y][x]));
    }
  }

  if (startPos === null || endPos === null)
    throw new Error("Start or end pos is null");

  const startNode = getNode(startPos, nodes, mazeSize);
  if (startNode === null) throw new Error("Start node is wall");
  if (getNode(endPos, nodes, mazeSize) === null)
    throw new Error("End node is wall");

  startNode.distance = 0;
  let currentPos = startPos;

  while (1) {
    const currentNode = getNode(currentPos, nodes, mazeSize);
    if (currentNode === null) throw new Error("Current node is wall");

    currentNode.isVisited = true;

    const left = getNode(
      { x: currentPos.x - 1, y: currentPos.y },
      nodes,
      mazeSize
    );
    if (left !== null) recalculateNode(left, currentPos, currentNode.distance);

    const right = getNode(
      { x: currentPos.x + 1, y: currentPos.y },
      nodes,
      mazeSize
    );
    if (right !== null)
      recalculateNode(right, currentPos, currentNode.distance);

    const top = getNode(
      { x: currentPos.x, y: currentPos.y - 1 },
      nodes,
      mazeSize
    );
    if (top !== null) recalculateNode(top, currentPos, currentNode.distance);

    const bottom = getNode(
      { x: currentPos.x, y: currentPos.y + 1 },
      nodes,
      mazeSize
    );
    if (bottom !== null)
      recalculateNode(bottom, currentPos, currentNode.distance);

    if (currentPos.x === endPos.x && currentPos.y == endPos.y) break;

    let shortestDistancePos: Pos | null = null;
    for (let [y, row] of nodes.entries()) {
      for (let [x, node] of row.entries()) {
        // null means wall
        if (node === null) continue;

        if (node.isVisited) continue;

        if (shortestDistancePos === null) {
          shortestDistancePos = { x, y };
          continue;
        }

        const shortestDistanceNode = getNode(
          shortestDistancePos,
          nodes,
          mazeSize
        );
        // This shouldn't ever happen, since if node is null it gets skipped
        if (shortestDistanceNode === null)
          throw new Error("Shortest distance node is wall");

        if (shortestDistanceNode.distance > node.distance) {
          shortestDistancePos = { x, y };
        }
      }
    }

    if (shortestDistancePos === null) break;

    currentPos = shortestDistancePos;
  }

  // no path
  let throughPos = getNode(endPos, nodes, mazeSize)?.throughPos || null;

  let path: Pos[] = [];

  while (1) {
    if (throughPos === null) return [];

    path.push(throughPos);

    throughPos = getNode(throughPos, nodes, mazeSize)?.throughPos || null;

    if (throughPos?.x === startPos.x && throughPos?.y === startPos.y) break;
  }

  return path;
}
