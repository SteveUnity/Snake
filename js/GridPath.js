"use strict";
const width = 60;
const height = 60;
const maxRank = Math.floor(Math.min(width, height) / 2);
const scale = 25;
const maxLength = 20;
const offset = 2;
const jiggle = 0;
const radius = 4;
const straightness = 0.95;
class GridPath {
    grid = [];
    get Grid() {
        return this.grid;
    }
    constructor() {
        for (let w = 0; w < width; w++) {
            let row = [];
            for (let h = 0; h < height; h++) {
                row.push(new Cell([w, h], null));
            }
            this.grid.push(row);
            // this.grid.push(new Array(this.height).fill(null));
        }
    }
    GetAllCells() {
        return this.grid.flat();
    }
    // public getRandomEmptyCell (){
    //     const freeCells = this.grid.flat().filter(cell => cell.Arrow === null);
    //     if(freeCells.length === 0){
    //         return null;
    //     }
    //     const cell = freeCells[Math.floor(Rand() * freeCells.length)];
    //     const direction = Math.floor(Rand() * 4);
    //     switch (direction) {
    //         case Direction.LEFT:{
    //             const row = this.grid[cell.Id[0]];
    //             for (let i = 0; i < row.length; i++) {
    //                 if(row[i].Arrow === null){
    //                     return row[i];
    //                 }
    //             }
    //             break;
    //         }
    //         case Direction.RIGHT:{
    //             const row = this.grid[cell.Id[0]];
    //             for (let i = row.length-1; i >= 0; i--) {
    //                 if(row[i].Arrow === null){
    //                     return row[i];
    //                 }
    //             }
    //             break;
    //         }
    //         case Direction.UP:
    //             for (let i = 0; i < this.grid.length; i++) {
    //                 if(this.grid[i][cell.Id[1]].Arrow === null){
    //                     return this.grid[i][cell.Id[1]];
    //                 }
    //             }
    //             break;
    //         case Direction.DOWN:
    //             for (let i = this.grid.length-1; i >= 0; i--) {
    //                 if(this.grid[i][cell.Id[1]].Arrow === null){
    //                     return this.grid[i][cell.Id[1]];
    //                 }
    //             }
    //             break;
    //         default:
    //             break;
    //     }
    //     return null;
    // }
    // public getRandomEmptyCellEdge(){
    //     let edgeCells = [...this.grid[0],...this.grid[this.grid.length-1],...this.grid.map(row => row[0]),...this.grid.map(row => row[row.length-1])];
    //     edgeCells = edgeCells.filter(cell => cell.Arrow == null);
    //     // console.log(edgeCells);
    //     return edgeCells[Math.floor(Rand() * edgeCells.length)];
    // }
    getNextEmptyCell(prev, direction, randomness = 0.95) {
        if (direction == null) {
            direction = Math.floor(Rand() * 4);
        }
        else {
            direction = Rand() > 1 - randomness ? Math.floor(Rand() * 4) : direction;
        }
        let failedCounter = 0;
        let x = prev.Id[0];
        let y = prev.Id[1];
        do {
            let cell = null;
            switch (direction) {
                case Direction.UP:
                    cell = this.grid[x]?.[y - 1];
                    if (cell && cell.Arrow == null) {
                        return { direction, cell };
                    }
                    break;
                case Direction.RIGHT:
                    cell = this.grid[x + 1]?.[y];
                    if (cell && cell.Arrow == null) {
                        return { direction, cell };
                    }
                    break;
                case Direction.DOWN:
                    cell = this.grid[x]?.[y + 1];
                    if (cell && cell.Arrow == null) {
                        return { direction, cell };
                    }
                    break;
                case Direction.LEFT:
                    cell = this.grid[x - 1]?.[y];
                    if (cell && cell.Arrow == null) {
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
    getPeremeterCells(index) {
        let perimeterCells = [...this.grid.flat().filter(cell => {
                if (cell.Id[0] === index && cell.Id[1] >= index && cell.Id[1] < height - index) {
                    return true;
                }
                if (cell.Id[0] === width - index - 1 && cell.Id[1] >= index && cell.Id[1] < height - index) {
                    return true;
                }
                if (cell.Id[1] === index && cell.Id[0] >= index && cell.Id[0] < width - index) {
                    return true;
                }
                if (cell.Id[1] === height - index - 1 && cell.Id[0] >= index && cell.Id[0] < width - index) {
                    return true;
                }
                return false;
            })];
        return perimeterCells;
    }
    // private ValidateCellForArrow(Arrow: Arrow, cell: Cell): boolean{
    //     // arrow cannot point to itself
    //     // arrow cannot point to another arrows head
    // }
    GenerateArrow(start, length, rank) {
        // cannot point to an arrow head in the opposite direction (looking at each other)
        // cannot point to its own body
        let next = this.getNextEmptyCell(start, null, 1);
        if (next == null) {
            return null;
        }
        let arrow = new Arrow(start.Id, next.direction, rank);
        // check if the arrow points to an arrow head in the opposite direction (looking at each other)
        let ray = this.getArrowHeadRay(arrow);
        {
            let collidingArrow = ray.find(cell => cell.Arrow && cell.Arrow.Direction == (arrow.Direction + 2) % 4 && cell.Arrow.TailCell[0] == cell.Id[0] && cell.Arrow.TailCell[1] == cell.Id[1]);
            if (collidingArrow) {
                console.log("collidingArrow", collidingArrow.Id);
                return null;
            }
        }
        {
            let x = 0;
            let y = 0;
            switch (next.direction) {
                case Direction.UP:
                    // x = arrow
                    break;
                case Direction.RIGHT:
                    break;
                case Direction.DOWN:
                    break;
                case Direction.LEFT:
                    break;
            }
        }
        arrow.AddPoint(next.cell.Id);
        next.cell.Arrow = arrow;
        start.Arrow = arrow;
        for (let i = 2; i < length; i++) {
            next = this.getNextEmptyCell(next.cell, next.direction, Math.floor(Rand() * 10) / 10);
            if (next == null || ray.includes(next.cell)) {
                break;
            }
            arrow.AddPoint(next.cell.Id);
            next.cell.Arrow = arrow;
        }
        return arrow;
    }
    validateArrowHeadCollision(cell, direction) {
        if (!cell.Arrow)
            return false;
        const lastCell = cell.Arrow.Path[cell.Arrow.Path.length - 1];
        if (lastCell[0] !== cell.Id[0] || lastCell[1] !== cell.Id[1])
            return false;
        if (cell.Arrow.Direction !== direction)
            return false;
        return true;
    }
    RemoveArrow(arrow) {
        let path = arrow.Path;
        for (let i = 0; i < path.length; i++) {
            let cell = this.grid[path[i][0]][path[i][1]];
            cell.Arrow = null;
        }
    }
    IsArrowClearToExit(arrow) {
        // check if there are no filled cells in fornt of the arrow
        let path = arrow.Path;
        let direction = arrow.Direction;
        console.log("IsArrowClearToExit", path, Direction[direction]);
        switch (direction) {
            case Direction.UP:
                for (let i = 1; i < height - path[0][1]; i++) {
                    if (this.grid[path[i][0]][path[i][1]].Arrow != null) {
                        return false;
                    }
                }
                break;
            case Direction.RIGHT:
                for (let i = 1; i < path.length; i++) {
                    if (this.grid[path[i][0]][path[i][1]].Arrow != null) {
                        return false;
                    }
                }
                break;
            case Direction.DOWN:
                for (let i = 1; i < path.length; i++) {
                    if (this.grid[path[i][0]][path[i][1]].Arrow != null) {
                        return false;
                    }
                }
                break;
            case Direction.LEFT:
                for (let i = 1; i < path.length; i++) {
                    if (this.grid[path[i][0]][path[i][1]].Arrow != null) {
                        return false;
                    }
                }
                break;
        }
        return true;
    }
    getArrowHeadRay(arrow) {
        let direction = (arrow.Direction + 2) % 4;
        let x = arrow.TailCell[0];
        let y = arrow.TailCell[1];
        let cells = [];
        console.log("getArrowHeadRay", Direction[direction]);
        switch (direction) {
            case Direction.UP:
                y--;
                for (let i = y; i >= 0; i--) {
                    cells.push(this.grid[x][i]);
                }
                return cells;
            case Direction.RIGHT:
                x++;
                for (let i = x; i < width; i++) {
                    cells.push(this.grid[i][y]);
                }
                return cells;
            case Direction.DOWN:
                y++;
                for (let i = y; i < height; i++) {
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
}
var Direction;
(function (Direction) {
    Direction[Direction["UP"] = 0] = "UP";
    Direction[Direction["RIGHT"] = 1] = "RIGHT";
    Direction[Direction["DOWN"] = 2] = "DOWN";
    Direction[Direction["LEFT"] = 3] = "LEFT";
})(Direction || (Direction = {}));
class Arrow {
    id;
    direction = Direction.UP;
    path = [];
    rank;
    arrowElement = null;
    collisionElement = null;
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
    AddPoint(point) {
        this.path.push(point);
    }
    GetPoints() {
        return [...this.path];
    }
    colors = [60, 90, 120, 150, 180, 210, 240, 270];
    GetArrowElement() {
        if (this.arrowElement && this.collisionElement)
            return [this.arrowElement, this.collisionElement];
        let d = this.stringifyBreakPointsToPath(this.path.reverse());
        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arrow.setAttribute("d", d);
        arrow.classList.add("arrowElement");
        let rot = (320 / maxRank) * (this.rank + 2);
        arrow.style.filter = `hue-rotate(${rot}deg)`;
        arrow.style.strokeWidth = scale / 5 + '';
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
        collisionElement.addEventListener("click", () => {
            this.ClearToExit();
        });
        this.collisionElement = collisionElement;
        return [arrow, collisionElement];
    }
    ClearToExit() {
        let ray = gridPath.getArrowHeadRay(this);
        console.log(ray.map(cell => cell.Arrow == null));
        let blocked = ray.some(cell => cell.Arrow !== null);
        console.log("blocked", blocked);
        if (blocked) {
            this.arrowElement?.classList.add("collided");
            return;
        }
        else {
            this.arrowElement?.classList.remove("collided");
            console.log("click", this, this.arrowElement, this.collisionElement);
            // this.arrowElement?.remove();
            // this.arrowElement = null;
            this.collisionElement?.remove();
            this.collisionElement = null;
            gridPath.RemoveArrow(this);
            this.AnimateArrowExit(ray);
        }
        return;
    }
    AnimateArrowExit(ray) {
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
            let d = this.stringifyBreakPointsToPath(this.path);
            this.arrowElement?.setAttribute("d", d);
            if (ray.length === 0) {
                clearInterval(interval);
                animationEnded(this.direction, this);
                return;
            }
        }, 50);
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
        for (let i = 0; i < breakPoints.length; i++) {
            maxX = Math.max(maxX, breakPoints[i][0] + offset + 1);
            maxY = Math.max(maxY, breakPoints[i][1] + offset + 1);
        }
        let points = breakPoints.map((bp) => ([(bp[0] + offset) * scale + (Rand() * jiggle - jiggle / 2), (bp[1] + offset) * scale + (Rand() * jiggle - jiggle / 2)]));
        let expPoints = [points[0]];
        for (let i = 1; i < points.length - 1; i++) {
            let dist1 = distance(points[i - 1], points[i]);
            let dist2 = distance(points[i], points[i + 1]);
            let minRad = Math.min(dist1 / 2, dist2 / 2, radius);
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
    arrow;
    constructor(id, arrow) {
        this.id = id;
        this.arrow = arrow;
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
}
// var gridPath = new GridPath();
// console.log(gridPath.getRandomEmptyCellEdge());
