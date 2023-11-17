<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { onMount } from "svelte";
  import { calculatePath, type Pos } from "./lib/pathfinding";

  let startPos = { x: 0, y: 0 };
  let endPos = { x: 0, y: 0 };

  let mazeSize = 10;
  let maze = Array(mazeSize).fill(Array(mazeSize).fill(0));

  let path: Pos[] = [];

  function resizeMaze(newSize: number) {
    const newMaze: number[][] = [];

    if (newSize < mazeSize) {
      for (let y = 0; y < newSize; y++) {
        newMaze.push([]);
        for (let x = 0; x < newSize; x++) {
          newMaze[y].push(maze[y][x]);
        }
      }
    } else {
      // expand
      for (let y = 0; y < mazeSize; y++) {
        newMaze.push([]);
        for (let x = 0; x < mazeSize; x++) {
          newMaze[y].push(maze[y][x]);
        }
        for (let x = 0; x < newSize - mazeSize; x++) {
          newMaze[y].push(0);
        }
      }

      // padding
      for (let y = 0; y < newSize - mazeSize; y++) {
        newMaze.push(Array(newSize).fill(0));
      }
    }

    maze = newMaze;
    mazeSize = newSize;
  }

  function changeTile(pos: Pos) {
    maze[pos.y][pos.x] = 1 - maze[pos.y][pos.x];
  }

  function getNodeColor(pos: Pos, maze: number[][], path: Pos[]) {
    for (let nodePos of path) {
      if (nodePos.x === pos.x && nodePos.y === pos.y) return "bg-pink-500";
    }

    if (maze[pos.y][pos.x] === 1) return "bg-zinc-9500";

    return "bg-zinc-50";
  }

  // TODO: all columns act the same when creating
  resizeMaze(mazeSize);

  $: maze && (path = calculatePath(startPos, endPos, maze));
</script>

<div
  class="bg-zinc-950 w-full h-screen flex justify-center items-center relative"
>
  <div class="flex flex-col gap-2">
    {#each maze as row, y}
      <div class="flex flex-row gap-2">
        {#each row as tile, x}
          <!-- TODO: getNodeColor doesn't upate unless one of its arguments does -->
          <button
            in:scale={{}}
            out:scale={{}}
            on:click={() => changeTile({ x, y })}
            class="w-10 h-10 {getNodeColor({ x, y }, maze, path)} rounded-sm"
          />
        {/each}
      </div>
    {/each}
  </div>
</div>

<div class="absolute bottom-10 right-0 left-0 flex justify-center items-center">
  <input
    class="accent-pink-500"
    type="range"
    value={mazeSize}
    min={0}
    max={21}
    on:input={(e) => {
      resizeMaze(Number(e?.target?.value) || 0);
    }}
  />
</div>
