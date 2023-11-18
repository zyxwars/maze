<script lang="ts">
  import { fly, scale, slide } from "svelte/transition";
  import { calculatePath, type Pos } from "./lib/pathfinding";
  import { onDestroy, onMount } from "svelte";
  import { quintOut } from "svelte/easing";

  let maxMazeSize = 20;
  let mazeSize = 5;
  // empty rows need to exist for the animation to work correctly
  let maze = [
    [0, 0, 0, 0, 0],
    [2, 0, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 0, 3, 0],
    [0, 0, 0, 0, 0],
    [],
    [],
    [],
    [],
    [],
  ];

  let path: Pos[] = [];

  function resizeMaze(newSize: number) {
    const newMaze: number[][] = [];

    if (mazeSize < newSize) {
      // expand
      for (let y = 0; y < mazeSize; y++) {
        newMaze.push([]);
        newMaze[y].push(...maze[y]);
        newMaze[y].push(...Array(newSize - mazeSize).fill(0));
      }
      // Array.fill uses the same object, Array.from to creates unique sub arrays
      // https://stackoverflow.com/questions/35578478/array-prototype-fill-with-object-passes-reference-and-not-new-instance
      newMaze.push(
        ...Array.from({ length: newSize - mazeSize }, () =>
          Array(newSize).fill(0)
        )
      );
    } else {
      //shrink
      for (let y = 0; y < newSize; y++) {
        newMaze.push([]);
        for (let x = 0; x < newSize; x++) {
          newMaze[y].push(maze[y][x]);
        }
      }

      // start and end might be outside of range
      let startPos: Pos | null = null;
      let endPos: Pos | null = null;
      for (let y = 0; y < mazeSize; y++) {
        for (let x = 0; x < mazeSize; x++) {
          if (maze[y][x] === 2) startPos = { x, y };
          else if (maze[y][x] === 3) endPos = { x, y };
        }
      }

      // shouldn't happen under normal cirumstances
      if (startPos === null || endPos === null)
        throw new Error("Start or end pos is null");

      if (startPos.x >= newSize) {
        startPos.x = newSize - 1;
      }
      if (startPos.y >= newSize) {
        startPos.y = newSize - 1;
      }
      if (endPos.x >= newSize) {
        endPos.x = newSize - 1;
      }
      if (endPos.y >= newSize) {
        endPos.y = newSize - 1;
      }

      if (startPos.x === endPos.x && startPos.y === endPos.y) {
        startPos.x -= 1;
      }

      newMaze[startPos.y][startPos.x] = 2;
      newMaze[endPos.y][endPos.x] = 3;
    }

    newMaze.push(...Array(maxMazeSize - newSize).fill([]));

    maze = newMaze;
    mazeSize = newSize;
  }

  function changeTile(pos: Pos) {
    maze[pos.y][pos.x] = 1 - maze[pos.y][pos.x];
  }

  function getNodeColor(
    pos: Pos,
    maze: number[][],
    path: Pos[],
    hoveringOverTile: Pos | null,
    hoveringType: 2 | 3,
    isDragging: boolean
  ) {
    if (hoveringOverTile?.x === pos.x && hoveringOverTile?.y === pos.y) {
      if (hoveringType === 2) return "bg-cyan-200";

      return "bg-pink-200";
    }

    if (!isDragging) {
      for (let nodePos of path) {
        if (nodePos.x === pos.x && nodePos.y === pos.y) return "bg-pink-300";
      }
    }

    if (maze[pos.y][pos.x] === 1) return "bg-zinc-950";

    if (isDragging && maze[pos.y][pos.x] === hoveringType) return "bg-zinc-50";

    if (maze[pos.y][pos.x] === 2) return "bg-cyan-500";

    if (maze[pos.y][pos.x] === 3) return "bg-pink-500";

    return "bg-zinc-50";
  }

  function getNodeColorWithFlip(
    pos: Pos,
    maze: number[][],
    path: Pos[],
    hoveringOverTile: Pos | null,
    hoveringType: 2 | 3,
    isDragging: boolean
  ) {
    //  a bit of a hacky place to add flipped
    // this triggers flip transition each time a tile type changes

    const color = getNodeColor(
      pos,
      maze,
      path,
      hoveringOverTile,
      hoveringType,
      isDragging
    );

    const flip = maze[pos.y][pos.x] === 1 ? " flipped" : "";

    return color + flip;
  }

  function startDragTile(e: DragEvent, dragStartPos: Pos) {
    const data = { dragStartPos };
    e.dataTransfer?.setData("text/plain", JSON.stringify(data));
  }

  function dropTile(e: DragEvent, tilePos: Pos) {
    e.preventDefault();

    const textData = e.dataTransfer?.getData("text/plain");
    if (textData === undefined) return;

    const data = JSON.parse(textData);

    maze[data.dragStartPos.y][data.dragStartPos.x] = 0;
    maze[tilePos.y][tilePos.x] = hoveringType;
  }

  onMount(() => {
    document.addEventListener("mousedown", () => (isPainting = true), {
      capture: false,
    });
    document.addEventListener("mouseup", () => (isPainting = false), {
      capture: false,
    });

    isMounted = true;
  });

  onDestroy(() => {
    document.removeEventListener("mousedown", () => (isPainting = true), {
      capture: false,
    });
    document.addEventListener("mouseup", () => (isPainting = false), {
      capture: false,
    });
  });

  let isPainting = false;

  let isDragging = false;
  // 2 is start 3 is end
  let hoveringType: 2 | 3 = 2;
  let hoveringOverTile: Pos | null = null;

  let isMounted = false;

  $: maze && (path = calculatePath(maze, mazeSize));
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="bg-zinc-950 w-full h-screen flex justify-center items-center relative"
  on:mouseleave={() => (isPainting = false)}
>
  <div class="flex flex-col aspect-square w-1/3">
    {#each maze as row, y}
      {#if isMounted}
        <div
          in:slide={{
            delay: 250 + y * 200,
            duration: 300,
            easing: quintOut,
            axis: "y",
          }}
          class="flex flex-row"
        >
          {#each row as tile, x}
            <!-- getNodeColor doesn't update unless one of its arguments does -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="aspect-square flex-1">
              <div
                class="tile-transitions relative-margin flex-1 aspect-square {getNodeColorWithFlip(
                  { x, y },
                  maze,
                  path,
                  hoveringOverTile,
                  hoveringType,
                  isDragging
                )} rounded-sm"
                draggable={tile === 2 || tile === 3 ? "true" : "false"}
                on:dragstart={(e) => {
                  startDragTile(e, { x, y });
                  // TODO:
                  hoveringType = tile;
                }}
                on:drop={(e) => dropTile(e, { x, y })}
                on:dragenter={() => (hoveringOverTile = { x, y })}
                on:dragleave={() => (hoveringOverTile = null)}
                on:dragend={() => {
                  hoveringOverTile = null;
                  isDragging = false;
                }}
                on:drag={() => {
                  // https://stackoverflow.com/questions/36379184/html5-draggable-hide-original-element
                  isDragging = true;
                  isPainting = false;
                }}
                ondragover={// false means droppable area
                tile !== hoveringType && (tile === 2 || tile === 3)
                  ? "return true"
                  : "return false"}
                in:scale={{ delay: 0 }}
                out:scale={{ delay: 0 }}
                on:mousedown={() => {
                  if (isDragging) return;
                  if (tile !== 0 && tile !== 1) return;
                  changeTile({ x, y });
                }}
                on:mouseenter={() => {
                  if (!isPainting) return;
                  if (tile !== 0 && tile !== 1) return;
                  changeTile({ x, y });
                }}
              />
            </div>
          {/each}
        </div>
      {/if}
    {/each}
  </div>
</div>

{#if isMounted}
  <div
    class="absolute bottom-12 right-0 left-0 flex justify-center items-center"
  >
    <input
      in:slide={{
        delay: 250 + (mazeSize + 1) * 200,
        duration: 300,
        easing: quintOut,
        axis: "y",
      }}
      class="accent-pink-500"
      type="range"
      value={mazeSize}
      min={3}
      max={maxMazeSize}
      on:input={(e) => {
        // TODO:
        resizeMaze(Number(e?.target?.value) || 0);
      }}
    />
  </div>
{/if}

<style>
  .relative-margin {
    margin: 6%;
  }

  .tile-transitions {
    transition: background-color 1s, transform 1s;
  }

  .flipped {
    transform: rotateX(180deg);
  }
</style>
