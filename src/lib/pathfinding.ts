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

function getNode({ x, y }: Pos, nodes: Nodes) {
  if (x < 0) return null;
  if (y < 0) return null;

  if (x >= nodes[0].length) return null;
  if (y >= nodes.length) return null;

  return nodes[y][x];
}

function recalculateNode(node: Node, throughPos: Pos, throughDistance: number) {
  if (node.distance > throughDistance + 1) {
    node.distance = throughDistance + 1;
    node.throughPos = throughPos;
  }
}

export function calculatePath(startPos: Pos, endPos: Pos, maze: number[][]) {
  let nodes: Nodes = [];
  for (let [i, row] of maze.entries()) {
    nodes.push([]);
    for (let tile of row) {
      nodes[i].push(createNode(tile));
    }
  }

  const startNode = getNode(startPos, nodes);
  if (startNode === null) throw new Error("Start node is wall");
  if (getNode(endPos, nodes) === null) throw new Error("End node is wall");

  startNode.distance = 0;
  let currentPos = startPos;

  while (1) {
    const currentNode = getNode(currentPos, nodes);
    if (currentNode === null) throw new Error("Current node is wall");

    currentNode.isVisited = true;

    const left = getNode({ x: currentPos.x - 1, y: currentPos.y }, nodes);
    if (left !== null) recalculateNode(left, currentPos, currentNode.distance);

    const right = getNode({ x: currentPos.x + 1, y: currentPos.y }, nodes);
    if (right !== null)
      recalculateNode(right, currentPos, currentNode.distance);

    const top = getNode({ x: currentPos.x, y: currentPos.y - 1 }, nodes);
    if (top !== null) recalculateNode(top, currentPos, currentNode.distance);

    const bottom = getNode({ x: currentPos.x, y: currentPos.y + 1 }, nodes);
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

        const shortestDistanceNode = getNode(shortestDistancePos, nodes);
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
  let throughPos = getNode(endPos, nodes)?.throughPos || null;

  let path: Pos[] = [];

  while (1) {
    if (throughPos === null) return [];

    path.push(throughPos);

    throughPos = getNode(throughPos, nodes)?.throughPos || null;

    if (throughPos?.x === startPos.x && throughPos?.y === startPos.y) break;
  }

  return path;
}
