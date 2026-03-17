"use strict";
const props = JSON.parse(localStorage.getItem("props") ?? `{
    "level" : 1,
    "width" : 20,
    "height" : 20,
    "maxLength" : 20,
    "jiggle" : 0,
    "straightness" : 0.95
}`);
props.maxRank = 10;
props.scale = 20;
props.offset = 0;
props.radius = 4;
props.seedShift = 4885;
document.getElementById("level").value = props.level.toString();
document.getElementById("width").value = props.width.toString();
document.getElementById("height").value = props.height.toString();
document.getElementById("maxLength").value = props.maxLength.toString();
document.getElementById("jiggle").value = props.jiggle.toString();
document.getElementById("straightness").value = props.straightness.toString();
/**
     * Creates a seeded pseudorandom number generator (Mulberry32 algorithm)
     * @param {number} seed - Any integer seed value
     * @returns {function} - Function that returns a random number in [0, 1)
     */
function seededRandomGenerator(seed) {
    // Ensure seed is a 32-bit unsigned integer
    let state = seed >>> 0;
    return function () {
        // Mulberry32 algorithm
        state += 0x6D2B79F5;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
let rngSeed = props.level > 0 ? props.level : Math.floor(Math.random() * 4836651);
// const rng = seededRandomGenerator(rngSeed);
function Rand() {
    return seededRandomGenerator(rngSeed++)();
}
class GridPath {
    grid = [];
    arrows = new Map();
    constructor() {
        // rngSeed = seededRandomGenerator(props.seedShift+(props.seedShift*props.level))();
        for (let w = 0; w < props.width; w++) {
            let row = [];
            for (let h = 0; h < props.height; h++) {
                row.push(new Cell([w, h], null));
            }
            this.grid.push(row);
            // this.grid.push(new Array(this.height).fill(null));
        }
    }
    DeleteArrow(arrow) {
        this.arrows.delete(arrow.Id.toString());
        if (this.arrows.size === 0) {
            setTimeout(() => {
                console.warn("No More Arrows, You Win!");
                window.alert("No More Arrows, You Win!");
            }, 1000);
        }
    }
    AddArrow(arrow) {
        this.arrows.set(arrow.Id.toString(), arrow);
    }
    get Grid() {
        return this.grid;
    }
    GetAllCells() {
        return this.grid.flat();
    }
    GetRandomEmptyCell() {
        let cells = this.grid.flat().filter(cell => cell.Arrow == null && cell.Rank == 0);
        if (cells.length === 0) {
            return null;
        }
        return cells[Math.floor(Rand() * cells.length)];
    }
    getEmptyCellWithRank() {
        let cells = this.grid.flat().filter(cell => cell.Rank >= 0 && cell.Arrow == null);
        if (cells.length === 0) {
            return null;
        }
        return cells[Math.floor(Rand() * cells.length)];
    }
    getEmptyCellByRank(rank) {
        let cells = this.grid.flat().filter(cell => (cell.Rank >= rank || cell.Rank == 0) && cell.Arrow == null);
        if (cells.length === 0) {
            return null;
        }
        return cells[Math.floor(Rand() * cells.length)];
    }
    lastDirection = null;
    findNextEmptyCell(prev, prefDir) {
        if (prefDir == null)
            prefDir = Math.floor(Rand() * 4);
        let x = prev.Id[0];
        let y = prev.Id[1];
        for (let i = 0; i < 4; i++) {
            let direction = (prefDir + i) % 4;
            let cell;
            switch (direction) {
                case Direction.UP:
                    cell = this.grid[x]?.[y - 1];
                    break;
                case Direction.RIGHT:
                    cell = this.grid[x + 1]?.[y];
                    break;
                case Direction.DOWN:
                    cell = this.grid[x]?.[y + 1];
                    break;
                case Direction.LEFT:
                    cell = this.grid[x - 1]?.[y];
                    break;
                default:
                    cell = this.grid[x]?.[y + 1];
                    break;
            }
            if (cell && cell.Arrow == null) {
                return { direction, cell };
            }
        }
        return null;
    }
    getNextEmptyCell(prev, direction, randomness = 0.95, rank = Infinity) {
        if (this.lastDirection == null)
            this.lastDirection = Math.floor(Rand() * 4);
        if (direction == null) {
            direction = randomness > Rand() ? Math.floor(Rand() * 4) : this.lastDirection;
        }
        this.lastDirection = direction;
        let failedCounter = 0;
        let x = prev.Id[0];
        let y = prev.Id[1];
        do {
            let cell = null;
            switch (direction) {
                case Direction.UP:
                    cell = this.grid[x]?.[y - 1];
                    if (cell && cell.Arrow == null && cell.Rank <= rank) {
                        return { direction, cell };
                    }
                    break;
                case Direction.RIGHT:
                    cell = this.grid[x + 1]?.[y];
                    if (cell && cell.Arrow == null && cell.Rank <= rank) {
                        return { direction, cell };
                    }
                    break;
                case Direction.DOWN:
                    cell = this.grid[x]?.[y + 1];
                    if (cell && cell.Arrow == null && cell.Rank <= rank) {
                        return { direction, cell };
                    }
                    break;
                case Direction.LEFT:
                    cell = this.grid[x - 1]?.[y];
                    if (cell && cell.Arrow == null && cell.Rank <= rank) {
                        return { direction, cell };
                    }
                    break;
                default:
                    break;
            }
            failedCounter++;
            direction = (direction + 1) % 4;
        } while (failedCounter < 4);
        return null;
    }
    getPeremeterCellsCercular(index) {
        let perimeterCells = [...this.grid.flat().filter(cell => {
                let w = Math.abs(cell.Id[0] - props.width / 2);
                let h = Math.abs(cell.Id[1] - props.height / 2);
                if (w * w + h * h <= index * index) {
                    return true;
                }
                return false;
            })];
        return perimeterCells;
    }
    getPeremeterCells(index) {
        let perimeterCells = [...this.grid.flat().filter(cell => {
                if (cell.Id[0] === index && cell.Id[1] >= index && cell.Id[1] < props.height - index) {
                    return true;
                }
                if (cell.Id[0] === props.width - index - 1 && cell.Id[1] >= index && cell.Id[1] < props.height - index) {
                    return true;
                }
                if (cell.Id[1] === index && cell.Id[0] >= index && cell.Id[0] < props.width - index) {
                    return true;
                }
                if (cell.Id[1] === props.height - index - 1 && cell.Id[0] >= index && cell.Id[0] < props.width - index) {
                    return true;
                }
                return false;
            })];
        return perimeterCells;
    }
    getEmptyRegion(startCell) {
        let region = [];
        let edge = [];
        let queue = [startCell];
        while (queue.length > 0) {
            let cell = queue.pop();
            if (cell == null)
                continue;
            let neighborCount = 0;
            if (cell.Id[0] > 0) {
                let neighborLeft = this.grid[cell.Id[0] - 1][cell.Id[1]];
                if (neighborLeft && neighborLeft.Arrow == null) {
                    if (!region.includes(neighborLeft)) {
                        queue.push(neighborLeft);
                    }
                    neighborCount++;
                }
            }
            if (cell.Id[0] < props.height - 1) {
                let neighborRight = this.grid[cell.Id[0] + 1][cell.Id[1]];
                if (neighborRight && neighborRight.Arrow == null) {
                    if (!region.includes(neighborRight)) {
                        queue.push(neighborRight);
                    }
                    neighborCount++;
                }
            }
            if (cell.Id[1] > 0) {
                let neighborTop = this.grid[cell.Id[0]][cell.Id[1] - 1];
                if (neighborTop && neighborTop.Arrow == null) {
                    if (!region.includes(neighborTop)) {
                        queue.push(neighborTop);
                    }
                    neighborCount++;
                }
            }
            if (cell.Id[1] < props.height - 1) {
                let neighborBottom = this.grid[cell.Id[0]][cell.Id[1] + 1];
                if (neighborBottom && neighborBottom.Arrow == null) {
                    if (!region.includes(neighborBottom)) {
                        queue.push(neighborBottom);
                    }
                    neighborCount++;
                }
            }
            region.push(cell);
            if (neighborCount == 1) {
                edge.push(cell);
            }
        }
        return { region, edge };
    }
    // private ValidateCellForArrow(Arrow: Arrow, cell: Cell): boolean{
    //     // arrow cannot point to itself
    //     // arrow cannot point to another arrows head
    // }
    async GenerateArrow(startCell, length, rank) {
        // cannot point to an arrow head in the opposite direction (looking at each other)
        // cannot point to its own body
        const Cells = [];
        const Rotations = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT].sort(() => Rand() * 2 - 1);
        let ray = null;
        let arrow = null;
        let maxRank = startCell.Rank > rank ? startCell.Rank : rank;
        let nextCell = null;
        while (Rotations.length > 0) {
            let direction = Rotations.pop();
            nextCell = this.findNextEmptyCell(startCell, direction);
            // must contain at least two cells (start cell and next cell)
            if (nextCell == null) {
                continue;
            }
            if (nextCell.cell.Rank > maxRank)
                maxRank = nextCell.cell.Rank;
            arrow = new Arrow(startCell.Id, nextCell.direction, maxRank);
            if (arrow == null)
                continue;
            // check if the arrow points to an arrow head in the opposite direction (looking at each other)
            ray = this.getArrowHeadRay(arrow);
            let collidingArrow = ray.find(cell => {
                if (!arrow)
                    return false;
                // empty cells are not considered
                if (!cell.Arrow)
                    return false;
                // if the arrow is pointing at a lower rank arrow
                if (cell.Rank < arrow.Rank) {
                    err("Arrow blocked by lower rank arrow");
                    return true;
                }
                // if the arrow points to an arrow head in the opposite direction (looking at each other)
                if (cell.Arrow.TailCell[0] == cell.Id[0] && cell.Arrow.TailCell[1] == cell.Id[1] && cell.Arrow.Direction == (arrow.Direction + 2) % 4) {
                    err("Arrow blocked by looking at each other");
                    return true;
                }
                // if the arrow is pointing at its own body
                //! this is not possible
                // if(cell.Arrow.TailCell[0] == cell.Id[0] && cell.Arrow.TailCell[1] == cell.Id[1]) return true;
                return false;
            });
            if (collidingArrow) {
                arrow = null;
                continue;
            }
            break;
        }
        if (!arrow || !nextCell) {
            err("No arrow found in four directions");
            return null;
        }
        // arrow is valid
        // if(startCell.Rank == 0){
        //     startCell.Rank = arrow.Rank;
        // }
        // if(nextCell.cell.Rank == 0){
        //     nextCell.cell.Rank = arrow.Rank;
        // }
        arrow.AddPoint(nextCell.cell.Id);
        Cells.push(startCell);
        Cells.push(nextCell.cell);
        startCell.Arrow = arrow;
        nextCell.cell.Arrow = arrow;
        // mark all empty ray cells as ranking one higher than the arrow
        if (!ray)
            ray = this.getArrowHeadRay(arrow);
        for (let i = 2; i < length; i++) {
            nextCell = this.findNextEmptyCell(nextCell.cell, null);
            if (nextCell == null || ray.includes(nextCell.cell)) {
                break;
            }
            if (nextCell.cell.Rank > arrow.Rank)
                arrow.RankElevated = nextCell.cell.Rank;
            arrow.AddPoint(nextCell.cell.Id);
            Cells.push(nextCell.cell);
            nextCell.cell.Arrow = arrow;
            // nextCell.cell.Rank = arrow.Rank;
        }
        // arrow.RankElevated = maxRank;
        for (const cell of ray) {
            if (cell.Rank == 0) {
                cell.Rank = arrow.Rank + 1;
            }
            else if (cell.Rank <= arrow.Rank) {
                if (cell.Arrow == null) {
                    cell.Rank = arrow.Rank + 1;
                }
                else {
                    for (const cell of Cells) {
                        cell.Arrow = null;
                    }
                    for (const cell of ray) {
                        cell.RevertRank();
                    }
                    err("Arrow blocked by another arrow after recalculating rank", { newRank: arrow.Rank, blocker: cell.Rank });
                    return null;
                }
            }
        }
        for (const cell of Cells) {
            cell.Arrow = arrow;
            cell.Rank = arrow.Rank;
        }
        startCell.fillColor("darkorange");
        if (startCell.textElement)
            startCell.textElement.textContent = startCell.Rank + (Direction[(arrow.Direction + 2) % 4].toString()[0]);
        await Main.PromisedDelay(10, JSON.stringify({ rank, maxRank, dir: Direction[arrow.Direction] }, null, 4));
        return arrow;
    }
    ArrowBlocked(arrow, ray) {
        if (!ray)
            ray = this.getArrowHeadRay(arrow);
        let blocked = ray.some(cell => cell.Arrow !== null);
        return blocked;
    }
    ArrowClearToExit(arrow) {
        let ray = this.getArrowHeadRay(arrow);
        let blocked = this.ArrowBlocked(arrow, ray);
        if (blocked) {
            arrow.Color = "orangered";
            return;
        }
        else {
            arrow.Color = null;
            this.RemoveArrow(arrow);
            arrow.ExitElements(ray);
            this.DeleteArrow(arrow);
        }
        return;
    }
    RemoveArrow(arrow) {
        let path = arrow.Path;
        for (let i = 0; i < path.length; i++) {
            let cell = this.grid[path[i][0]][path[i][1]];
            cell.Arrow = null;
        }
    }
    getArrowHeadRay(arrow) {
        let direction = (arrow.Direction + 2) % 4;
        let x = arrow.TailCell[0];
        let y = arrow.TailCell[1];
        let cells = [];
        // console.log("getArrowHeadRay", Direction[direction]);
        switch (direction) {
            case Direction.UP:
                y--;
                for (let i = y; i >= 0; i--) {
                    cells.push(this.grid[x][i]);
                }
                return cells;
            case Direction.RIGHT:
                x++;
                for (let i = x; i < props.width; i++) {
                    cells.push(this.grid[i][y]);
                }
                return cells;
            case Direction.DOWN:
                y++;
                for (let i = y; i < props.height; i++) {
                    cells.push(this.grid[x][i]);
                }
                return cells;
            case Direction.LEFT:
                x--;
                for (let i = x; i >= 0; i--) {
                    cells.push(this.grid[i][y]);
                }
                return cells;
        }
        return [];
    }
    Hint() {
        // get an arrow that is clear to exit
        let arrows = this.arrows.values();
        for (let arrow of arrows) {
            if (!arrow.IsBlocked()) {
                return arrow;
            }
        }
        return null;
    }
    ValidateLevel() {
        let grid = [];
        for (let x = 0; x < this.grid.length; x++) {
            let row = [];
            for (let y = 0; y < this.grid[x].length; y++) {
                row.push(this.grid[x][y].Arrow !== null);
            }
            grid.push(row);
        }
        let arrows = [...this.arrows.values()];
        const validateArrowExit = (arrow, grid) => {
            let ray = this.getArrowHeadRay(arrow);
            for (const cell of ray) {
                if (grid[cell.Id[0]][cell.Id[1]]) {
                    return false;
                }
            }
            return true;
        };
        let counter = 0;
        while (counter < arrows.length) {
            let arrow = arrows[counter];
            if (validateArrowExit(arrow, grid)) {
                arrows.splice(counter, 1);
                counter = 0;
                arrow.Color = "orangered";
                arrow.GetPoints().forEach(point => {
                    grid[point[0]][point[1]] = false;
                });
                continue;
            }
            counter++;
        }
        if (arrows.length > 0) {
            for (let x = 0; x < this.grid.length; x++) {
                for (let y = 0; y < this.grid[x].length; y++) {
                    if (grid[x][y]) {
                        this.grid[x][y].fillColor("#660000");
                    }
                }
            }
        }
        return arrows.length === 0;
    }
}
var Direction;
(function (Direction) {
    Direction[Direction["UP"] = 0] = "UP";
    Direction[Direction["RIGHT"] = 1] = "RIGHT";
    Direction[Direction["DOWN"] = 2] = "DOWN";
    Direction[Direction["LEFT"] = 3] = "LEFT";
})(Direction || (Direction = {}));
class Arrow {
    color = "";
    id;
    direction = Direction.UP;
    path = [];
    rank;
    arrowElement = null;
    collisionElement = null;
    animationStartTime = 0;
    animationSpeed = 150;
    constructor(id, direction, rank) {
        this.id = id;
        this.direction = direction;
        this.rank = rank;
        this.path.push([...this.id]);
    }
    get Path() {
        return [...this.path];
    }
    get Rank() {
        return this.rank;
    }
    get Id() {
        return `${this.id[0]},${this.id[1]}`;
    }
    get Direction() {
        return this.direction;
    }
    set Direction(direction) {
        this.direction = direction;
    }
    get HeadCell() {
        return this.path[0];
    }
    get TailCell() {
        return this.path[this.path.length - 1];
    }
    get Color() {
        return this.color;
    }
    set Color(color) {
        this.color = color ?? "";
        if (this.arrowElement)
            this.arrowElement.style.stroke = this.color;
    }
    AddPoint(point) {
        this.path.push(point);
    }
    GetPoints() {
        return [...this.path];
    }
    set RankElevated(rank) {
        this.rank = Math.max(this.rank, rank);
    }
    GetArrowElement() {
        if (this.arrowElement && this.collisionElement)
            return [this.arrowElement, this.collisionElement];
        let d = this.stringifyBreakPointsToPath(this.path.reverse());
        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arrow.setAttribute("d", d);
        arrow.classList.add("arrowElement");
        // arrow.style.stroke = this._invalid? "#ff0000" : ["#05a","#0089bf","#12a900","#ff7500"][this.direction];
        let colors = [];
        props.maxRank / 255;
        for (let i = 0; i < props.maxRank; i++) {
            colors.push(`rgb(${Math.round(i / props.maxRank * 255)},${Math.round(i / props.maxRank * 255)},255)`);
        }
        const color = this.color == "" ? "#aaa" : this.color;
        // arrow.style.stroke = color;
        arrow.style.strokeWidth = props.scale / 5 + '';
        // arrow.addEventListener("click", () => {
        //     console.log("click", this,arrow);
        //     this.arrowElement?.remove();
        //     this.arrowElement = null;
        //     this.collisionElement?.remove();
        //     this.collisionElement = null;
        //     gridPath.RemoveArrow(this);
        // });
        this.arrowElement = arrow;
        let collisionElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        collisionElement.setAttribute("d", d);
        collisionElement.classList.add("collisionElement");
        collisionElement.style.strokeWidth = props.scale * 1.1 + 'px';
        collisionElement.addEventListener("click", () => {
            if (Main.mouseUpBlocked) {
                Main.mouseUpBlocked = false;
                console.warn("mouseUpBlocked", Main.mouseUpBlocked);
                return;
            }
            this.ClearToExit();
        });
        collisionElement.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            Main.validateRay(this);
        });
        this.collisionElement = collisionElement;
        return [arrow, collisionElement];
    }
    ExitElements(ray) {
        this.collisionElement?.remove();
        this.collisionElement = null;
        this.AnimateArrowExit(ray);
    }
    IsBlocked(ray) {
        if (!ray)
            ray = Main.gridPath.getArrowHeadRay(this);
        let blocked = ray.some(cell => cell.Arrow !== null);
        return blocked;
    }
    ClearToExit() {
        let ray = Main.gridPath.getArrowHeadRay(this);
        let blocked = this.IsBlocked(ray);
        if (blocked) {
            this.arrowElement?.classList.add("collided");
            let keyframes = [
                { transform: `translate(1px, 1px)` },
                { transform: `translate(0px, 0px)` },
                { transform: `translate(-1px, -1px)` },
                { transform: `translate(0px, 0px)` },
                { transform: `translate(1px, 1px)` },
                { transform: `translate(0px, 0px)` },
            ];
            console.log("keyframes", keyframes);
            this.arrowElement?.animate(keyframes, {
                duration: 200,
                easing: "ease-in-out",
            });
            return;
        }
        else {
            this.arrowElement?.classList.remove("collided");
            this.collisionElement?.remove();
            this.collisionElement = null;
            Main.gridPath.RemoveArrow(this);
            this.AnimateArrowExit(ray);
            Main.gridPath.DeleteArrow(this);
        }
        return;
    }
    AnimateArrowExit_old(ray) {
        if (ray.length === 0) {
            animationEnded(this.direction, this);
            return;
        }
        let lastCell;
        ray.reverse();
        let interval = setInterval(() => {
            if (ray.length === 0) {
                clearInterval(interval);
                animationEnded(this.direction, this);
                return;
            }
            lastCell = ray.pop();
            if (!lastCell)
                return;
            this.path.shift();
            this.path.push(lastCell.Id);
            // newPath.unshift(lastCell.Id);
            let newD = this.stringifyBreakPointsToPath(this.path);
            let d = newD;
            this.arrowElement?.setAttribute("d", d);
            if (ray.length === 0) {
                clearInterval(interval);
                animationEnded(this.direction, this);
                return;
            }
        }, 500);
        function animationEnded(dir, arrow) {
            let counter = 0;
            let interval = setInterval(() => {
                counter++;
                if (counter > 40) {
                    clearInterval(interval);
                    arrow.arrowElement?.remove();
                    arrow.arrowElement = null;
                    console.warn("animationEnded Arrow Removed", arrow);
                    return;
                }
                arrow.path.shift();
                let x = arrow.path[arrow.path.length - 1][0];
                let y = arrow.path[arrow.path.length - 1][1];
                switch (dir) {
                    case Direction.DOWN:
                        y--;
                        break;
                    case Direction.LEFT:
                        x++;
                        break;
                    case Direction.UP:
                        y++;
                        break;
                    case Direction.RIGHT:
                        x--;
                        break;
                }
                arrow.path.push([x, y]);
                let d = arrow.stringifyBreakPointsToPath(arrow.path);
                arrow.arrowElement?.setAttribute("d", d);
            }, 50);
        }
    }
    AnimateArrowExit(ray) {
        ray.reverse();
        this.AnimateArrowExitSection(ray);
    }
    AnimateArrowExitSection(ray) {
        if (ray.length === 0) {
            this.AnimateArrowExitOutofview();
            return;
        }
        // console.log("AnimateArrowExitSection", ray);
        let lastCell = ray.pop();
        if (!lastCell)
            return;
        const newPath = [...this.path];
        newPath.shift();
        newPath.push(lastCell.Id);
        // this.arrowElement?.setAttribute('d', this.stringifyBreakPointsToPath(newPath));
        // return;
        this.arrowElement?.setAttribute('data-animate-to', JSON.stringify(newPath));
        this.arrowElement?.setAttribute('data-animate-from', JSON.stringify(this.path));
        this.animationStartTime = performance.now();
        this.animationSpeed = Math.max(this.animationSpeed * 0.8, 30);
        this.animate(this, ray);
    }
    exitCounter = 0;
    AnimateArrowExitOutofview() {
        this.exitCounter++;
        if (this.exitCounter > 100) {
            this.arrowElement?.remove();
            this.arrowElement = null;
            // console.warn("AnimateArrowExitOutofview Arrow Removed", this);
            return;
        }
        let lastCell = this.path[this.path.length - 1];
        lastCell = [...lastCell];
        switch (this.direction) {
            case Direction.UP:
                lastCell[1] += 1;
                break;
            case Direction.LEFT:
                lastCell[0] += 1;
                break;
            case Direction.DOWN:
                lastCell[1] -= 1;
                break;
            case Direction.RIGHT:
                lastCell[0] -= 1;
                break;
        }
        const newPath = [...this.path];
        newPath.shift();
        newPath.push(lastCell);
        // this.arrowElement?.setAttribute('d', this.stringifyBreakPointsToPath(newPath));
        // return;
        this.arrowElement?.setAttribute('data-animate-to', JSON.stringify(newPath));
        this.arrowElement?.setAttribute('data-animate-from', JSON.stringify(this.path));
        this.animationStartTime = performance.now();
        this.animationSpeed = Math.max(this.animationSpeed * 0.8, 10);
        this.animate(this, []);
    }
    animate(arrow, ray) {
        return requestAnimationFrame(() => {
            let timePassed = performance.now() - arrow.animationStartTime;
            let progress = timePassed / arrow.animationSpeed;
            let from = JSON.parse(arrow.arrowElement?.getAttribute('data-animate-from') ?? '[]');
            let to = JSON.parse(arrow.arrowElement?.getAttribute('data-animate-to') ?? '[]');
            let fc = 0;
            let lc = from.length - 1;
            from[fc][0] = from[fc][0] + (to[fc][0] - from[fc][0]) * progress;
            from[fc][1] = from[fc][1] + (to[fc][1] - from[fc][1]) * progress;
            from[lc][0] = from[lc][0] + (to[lc][0] - from[lc][0]) * progress;
            from[lc][1] = from[lc][1] + (to[lc][1] - from[lc][1]) * progress;
            arrow.arrowElement?.setAttribute('d', arrow.stringifyBreakPointsToPath(from));
            // console.log("animate", progress);
            if (progress < 1) {
                arrow.animate(arrow, ray);
            }
            else {
                arrow.path = to;
                arrow.AnimateArrowExitSection(ray);
            }
        });
    }
    stringifyBreakPointsToPath(breakPoints) {
        if (!breakPoints)
            return "";
        function distance(a, b) {
            return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
        }
        function pointFromDistance(a, b, dist) {
            let dx = b[0] - a[0];
            let dy = b[1] - a[1];
            let d = distance(a, b);
            return [Math.round(a[0] + dx * dist / d), Math.round(a[1] + dy * dist / d)];
        }
        let d = "";
        breakPoints = JSON.parse(JSON.stringify(breakPoints));
        for (const element of breakPoints) {
            element[0] = element[0] + 0.5;
            element[1] = element[1] + 0.5;
        }
        let points = breakPoints.map((bp) => ([(bp[0] + props.offset) * props.scale + (Rand() * props.jiggle - props.jiggle / 2), (bp[1] + props.offset) * props.scale + (Rand() * props.jiggle - props.jiggle / 2)]));
        let expPoints = [points[0]];
        for (let i = 1; i < points.length - 1; i++) {
            let dist1 = distance(points[i - 1], points[i]);
            let dist2 = distance(points[i], points[i + 1]);
            let minRad = Math.min(dist1 / 2, dist2 / 2, props.radius);
            let p1 = pointFromDistance(points[i - 1], points[i], dist1 - minRad);
            let p2 = pointFromDistance(points[i], points[i + 1], minRad);
            expPoints.push(p1, points[i], p2);
        }
        expPoints.push(points[points.length - 1]);
        d = `M ${expPoints[0].join(' ')}`;
        for (let i = 3; i < expPoints.length - 1; i += 3) {
            let a = expPoints[i - 2];
            let b = expPoints[i - 1];
            let c = expPoints[i];
            if (!isNaN(a[0]))
                d += ` L ${a.join(' ')}`;
            if (!isNaN(c[0]))
                d += ` Q ${b.join(' ')} ${c.join(' ')}`;
        }
        d += ` L ${expPoints[expPoints.length - 1].join(' ')}`;
        return d;
    }
}
class Cell {
    id;
    idstr;
    arrow;
    rank = 0;
    previousRank = 0;
    flags = {
        blocked: false,
        headLeft: true,
        headRight: true,
        headUp: true,
        headDown: true,
        bodyLeft: true,
        bodyRight: true,
        bodyUp: true,
        bodyDown: true,
    };
    // head left
    // head right
    // head up
    // head down
    // body left
    // body right
    // body up
    // body down
    // empty
    // blocked
    element = null;
    squareElement = null;
    textElement = null;
    constructor(id, arrow) {
        this.id = id;
        this.idstr = `${id[0]},${id[1]}`;
        this.arrow = arrow;
        this.Element;
    }
    get Rank() {
        return this.rank;
    }
    set Rank(rank) {
        this.previousRank = this.rank;
        this.rank = rank;
        this.TextElement;
    }
    get PreviousRank() {
        return this.previousRank;
    }
    get Id() {
        return this.id;
    }
    get Arrow() {
        return this.arrow;
    }
    set Arrow(arrow) {
        this.arrow = arrow;
    }
    get Element() {
        if (this.element) {
            return this.element;
        }
        let element = document.createElementNS("http://www.w3.org/2000/svg", "g");
        element.classList.add("cell");
        element.setAttribute("data-id", this.idstr);
        element.style.transform = `translate(${this.id[0] * props.scale}px,${this.id[1] * props.scale}px)`;
        this.element = element;
        let rect = this.squareElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        rect.setAttribute("width", props.scale.toString());
        rect.setAttribute("height", props.scale.toString());
        rect.setAttribute("fill", "none");
        rect.setAttribute("stroke", "grey");
        rect.setAttribute("stroke-width", "1");
        element.appendChild(rect);
        element.appendChild(this.TextElement);
        if (Main.gridGroup)
            Main.gridGroup.appendChild(element);
        return element;
    }
    get TextElement() {
        if (this.textElement) {
            this.textElement.textContent = this.Rank == 0 ? "" : this.Rank.toString();
            this.textElement.setAttribute("fill", `rgb(${Math.round(this.Rank / props.maxRank * 255)},${Math.round(this.Rank / props.maxRank * 255)},255)`);
            return this.textElement;
        }
        this.textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        this.textElement.setAttribute("x", "0");
        this.textElement.setAttribute("y", "0");
        this.textElement.setAttribute("text-anchor", "middle");
        this.textElement.setAttribute("dominant-baseline", "middle");
        this.textElement.setAttribute("font-size", props.scale / 2 + '');
        this.textElement.setAttribute("fill", `rgb(${Math.round(this.Rank / props.maxRank * 255)},${Math.round(this.Rank / props.maxRank * 255)},255)`);
        this.textElement.style.transform = `translate(${props.scale / 2}px,${props.scale / 2}px)`;
        this.textElement.textContent = this.Rank == 0 ? "" : this.Rank.toString();
        return this.textElement;
    }
    RevertRank() {
        this.rank = this.previousRank;
        this.TextElement;
    }
    // invalidate(){
    //     this.Rank = 0;
    //     this.TextElement;
    //     this.squareElement?.setAttribute("fill", "red");
    // }
    fillColor(color) {
        this.squareElement?.setAttribute("fill", color);
    }
}
// var gridPath = new GridPath();
// console.log(gridPath.getRandomEmptyCellEdge());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3JpZFBhdGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9HcmlkUGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsTUFBTSxLQUFLLEdBWVIsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJOzs7Ozs7O0VBTzdDLENBQUMsQ0FBQztBQUVKLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ25CLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ0osUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNqRSxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2pFLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFFLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDbkUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUN6RSxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBRSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ25FLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFFLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7QUFD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LEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6TixJQUFJLFNBQVMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3pDLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxRCxJQUFJLEVBQUUsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDckUsSUFBSSxFQUFFLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFD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