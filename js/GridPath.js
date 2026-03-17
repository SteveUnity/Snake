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
    GetEmptyCells() {
        return this.grid.flat().filter(cell => cell.Arrow == null && cell.Rank >= 0);
    }
    GetRandomEmptyCell() {
        let cells = this.grid.flat().filter(cell => cell.Arrow == null && cell.Rank == 0);
        if (cells.length === 0) {
            return null;
        }
        return cells[Math.floor(Rand() * cells.length)];
    }
    getEmptyCellWithRank() {
        let cells = this.grid.flat().filter(cell => cell.Rank > 0 && cell.Arrow == null);
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
        if (!prefDir)
            prefDir = Math.floor(Rand() * 4);
        let x = prev.Id[0];
        let y = prev.Id[1];
        let directions = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT].sort(() => Rand() * 2 - 1);
        directions.splice(directions.indexOf(prefDir), 1);
        directions.push(prefDir);
        directions.reverse();
        for (const direction of directions) {
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
            if (cell && cell.Arrow == null && cell.Rank >= 0) {
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
            nextCell = this.findNextEmptyCell(nextCell.cell);
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
                    err("Arrow blocked by another arrow after recalculating rank", { newRank: arrow.Rank, blocker: cell.Rank });
                    for (const cell of Cells) {
                        cell.Arrow = null;
                    }
                    for (const cell of ray) {
                        cell.RevertRank();
                    }
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
    getCellRay(cell, direction) {
        let cells = [];
        let x = cell.Id[0];
        let y = cell.Id[1];
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
        return cells;
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
        let d = this.stringifyBreakPointsToPath(this.path);
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
        if (breakPoints.length > 2) {
            for (let i = 0; i < breakPoints.length - 2; i++) {
                let bp0 = breakPoints[i], bp1 = breakPoints[i + 1], bp2 = breakPoints[i + 2];
                if (bp0[0] == bp1[0] && bp1[0] == bp2[0] || bp0[1] == bp1[1] && bp1[1] == bp2[1]) {
                    breakPoints.splice(i + 1, 1);
                    i--;
                }
            }
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3JpZFBhdGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9HcmlkUGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsTUFBTSxLQUFLLEdBWVIsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJOzs7Ozs7O0VBTzdDLENBQUMsQ0FBQztBQUVKLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ25CLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ0osUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNqRSxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2pFLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFFLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDbkUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUN6RSxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBRSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ25FLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFFLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7QUFD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LEtBQUssQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLG1CQUFtQixDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7WUFDckYsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ2pGLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNYLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDO1lBRXZCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO1lBQ2pFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO1lBRWpFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO1lBQ2pFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO1lBRWpFLEtBQUssQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM5RSxvQ0FBb0M7WUFDcEMsSUFBRyxRQUFRLEdBQUcsQ0FBQyxFQUFDLENBQUM7Z0JBQ2IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0IsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLEtBQUssQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNoQixLQUFLLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUlPLDBCQUEwQixDQUFDLFdBQWtCO1FBQ2pELElBQUksQ0FBQyxXQUFXO1lBQUUsT0FBTyxFQUFFLENBQUM7UUFDNUIsU0FBUyxRQUFRLENBQUMsQ0FBVyxFQUFFLENBQVc7WUFDdEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQ0QsU0FBUyxpQkFBaUIsQ0FBQyxDQUFXLEVBQUUsQ0FBVyxFQUFFLElBQVk7WUFDN0QsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFDRCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDWCxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDdEQsSUFBRyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBQyxDQUFDO1lBQ3ZCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxHQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLEdBQUcsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUMsR0FBRyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsR0FBRyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZFLElBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDO29CQUM3RSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFCLENBQUMsRUFBRSxDQUFDO2dCQUNSLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztRQUNELEtBQUssTUFBTSxPQUFPLElBQUksV0FBVyxFQUFFLENBQUM7WUFDaEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDOUIsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDbEMsQ0FBQztRQUNELElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFZLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6TixJQUFJLFNBQVMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3pDLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxRCxJQUFJLEVBQUUsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDckUsSUFBSSxFQUFFLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0QsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFDRCxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUMsQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDL0MsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN6QixJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENB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