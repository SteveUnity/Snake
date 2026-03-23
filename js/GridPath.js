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
props.animationSpeed = 0.2;
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
    get Arrows() {
        return [...this.arrows.values()];
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
    GetCell(x, y) {
        if (typeof x === "number") {
            if (y == null)
                return null;
            return this.grid[x][y];
        }
        return this.grid[x[0]][x[1]];
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
    getCellsByPositionRank(cell) {
        // find next empty cell in a circle
        let cellsRanks = { 0: [cell] };
        // fix w to min,max and itterate h from min to max
        // then fix h to min,max and itterate w from min to max
        // if rank is x then min is cell.id[0]-x and max is cell.id[0]+x
        let rank = 0;
        let added = true;
        while (added) {
            added = false;
            rank++;
            const cells = [];
            const min = cell.Id[0] - rank;
            const max = cell.Id[0] + rank;
            for (let w = min; w <= max; w++) {
                let cell = this.grid[w]?.[min];
                if (cell) {
                    added = true;
                    cells.push(cell);
                }
            }
            for (let w = min; w <= max; w++) {
                let cell = this.grid[w]?.[max];
                if (cell) {
                    added = true;
                    cells.push(cell);
                }
            }
            for (let h = min + 1; h <= max - 1; h++) {
                let cell = this.grid[min]?.[h];
                if (cell) {
                    added = true;
                    cells.push(cell);
                }
            }
            for (let h = min + 1; h <= max - 1; h++) {
                let cell = this.grid[max]?.[h];
                if (cell) {
                    added = true;
                    cells.push(cell);
                }
            }
            cellsRanks[rank] = cells; //.sort(()=>Rand()*2-1);
        }
        return cellsRanks;
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
        let direction = arrow.Direction;
        let x = arrow.HeadCell[0];
        let y = arrow.HeadCell[1];
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
    pathTotalLength = 0;
    constructor(id, direction, rank) {
        this.id = id;
        this.direction = direction;
        this.rank = rank;
        this.path.push([...this.id]);
    }
    get Length() {
        return this.path.length;
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
    PrependPoint(point) {
        this.path.unshift(point);
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
            let ray = Main.gridPath.getArrowHeadRay(this);
            for (let i = 0; i < ray.length; i++) {
                if (ray[i].Arrow)
                    break;
                this.PrependPoint(ray[i].Id);
                ray[i].Arrow = this;
            }
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
            this.pathTotalLength = this.arrowElement?.getTotalLength() ?? 0;
            this.arrowElement?.classList.remove("collided");
            this.collisionElement?.remove();
            this.collisionElement = null;
            Main.gridPath.RemoveArrow(this);
            // this.AnimateArrowExit(ray);
            this.AnimateArrowExit_new().then(() => {
                Main.gridPath.DeleteArrow(this);
                err("Arrow Exited and Deleted", { arrow: this });
            });
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
    AnimateArrowExit_new() {
        let forward = [(this.path[0][0] - this.path[1][0]), (this.path[0][1] - this.path[1][1])];
        log("AnimateArrowExit_new", { forward, 0: this.path[0], 1: this.path[1], arrow: this.path });
        function animateHead(head, forward, duration) {
            head[0] += forward[0] * (duration / props.scale) * props.animationSpeed;
            head[1] += forward[1] * (duration / props.scale) * props.animationSpeed;
            return head;
        }
        function animateTail(arrow, duration) {
            const elem = arrow.arrowElement;
            if (!elem)
                return false;
            let length = elem.getTotalLength();
            if (!length)
                return false;
            let strokeDasharray = length;
            let strokeDashoffset = (duration * props.animationSpeed);
            elem.style.strokeDasharray = `${strokeDasharray}`;
            elem.style.strokeDashoffset = `${strokeDashoffset}`;
            if (strokeDashoffset > (arrow.pathTotalLength + props.scale * 2)) {
                return true; // stop the animation
            }
            return false;
        }
        const startTime = performance.now();
        let promise = new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                let duration = performance.now() - startTime;
                const adjustedDuration = duration ** 2.3 * 0.0003;
                console.log({ duration, adjustedDuration });
                let newHead = animateHead([...this.path[0]], forward, adjustedDuration);
                let d = this.stringifyBreakPointsToPath([newHead, ...this.path.slice(1)]);
                this.arrowElement?.setAttribute("d", d);
                animateTail(this, adjustedDuration);
                let exitedView = false;
                // if head position + forward * length bigger than viewport, 
                // then the arrow is outside view and should be removed.
                // there is offset applied
                const tX = Main.rootGroup.dataTX;
                const tY = Main.rootGroup.dataTY;
                newHead[0] = (newHead[0] * props.scale) + tX - (this.pathTotalLength + 50 * forward[0]);
                newHead[1] = (newHead[1] * props.scale) + tY - (this.pathTotalLength + 50 * forward[1]);
                if (forward[0] + forward[1] > 0) {
                    // moving positive direction
                    if (newHead[0] > window.innerWidth || newHead[1] > window.innerHeight) {
                        console.log("exitedView", newHead);
                        exitedView = true;
                    }
                }
                else if ((newHead[0] < 0 || newHead[1] < 0)) {
                    console.log("exitedView negative", newHead);
                    // moving negative direction
                    exitedView = true;
                }
                if (exitedView) {
                    clearInterval(interval);
                    this.arrowElement?.remove();
                    this.arrowElement = null;
                    resolve(true);
                }
                // if tail is outside the viewport, remove the arrow and stop the animation
            }, 1);
        });
        return promise;
    }
    AnimateArrowExit(ray) {
        // ray.reverse();
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
        const newPath = [lastCell.Id, ...this.path];
        newPath.pop();
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
        return;
        this.exitCounter++;
        if (this.exitCounter > 100) {
            this.arrowElement?.remove();
            this.arrowElement = null;
            // console.warn("AnimateArrowExitOutofview Arrow Removed", this);
            return;
        }
        let firstCell = this.path[0];
        firstCell = [...firstCell];
        switch (this.direction) {
            case Direction.UP:
                firstCell[1] -= 1;
                break;
            case Direction.LEFT:
                firstCell[0] -= 1;
                break;
            case Direction.DOWN:
                firstCell[1] += 1;
                break;
            case Direction.RIGHT:
                firstCell[0] += 1;
                break;
        }
        const newPath = [firstCell, ...this.path];
        newPath.pop();
        // newPath.push(firstCell);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3JpZFBhdGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9HcmlkUGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsTUFBTSxLQUFLLEdBYVIsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJOzs7Ozs7O0VBTzdDLENBQUMsQ0FBQztBQUVKLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ25CLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ3ZCLEtBQUssQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDO0FBQ1IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNqRSxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2pFLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFFLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDbkUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUN6RSxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBRSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ25FLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFFLENBQUMsS0FBSyxHQUFHLEtB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SUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pOLElBQUksU0FBUyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDekMsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFELElBQUksRUFBRSxHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQztZQUNyRSxJQUFJLEVBQUUsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFN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