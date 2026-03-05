const props:{
    level: number;
    width: number;
    height: number;
    maxLength: number;
    jiggle: number;
    straightness: number;
    maxRank: number;
    scale: number;
    offset: number;
    radius: number;
} =JSON.parse(localStorage.getItem("props")??  `{
    "level" : 1,
    "width" : 20,
    "height" : 20,
    "maxLength" : 20,
    "jiggle" : 0,
    "straightness" : 0.95
}`);

props.maxRank = Math.floor(Math.min(props.width, props.height)/2);
props.scale = 40;
props.offset = 0;
props.radius = 4;
(<HTMLInputElement>document.getElementById("level")).value = props.level.toString();
(<HTMLInputElement>document.getElementById("width")).value = props.width.toString();
(<HTMLInputElement>document.getElementById("height")).value = props.height.toString();
(<HTMLInputElement>document.getElementById("maxLength")).value = props.maxLength.toString();
(<HTMLInputElement>document.getElementById("jiggle")).value = props.jiggle.toString();
(<HTMLInputElement>document.getElementById("straightness")).value = props.straightness.toString();
class GridPath{
    private grid: Array<Array<Cell>> = [];
    private arrows: Map<string, Arrow> = new Map();
    constructor(){
        
        for (let w = 0; w < props.width; w++) {
            let row = [];
            for (let h = 0; h < props.height; h++) {
                row.push( new Cell([w,h], null));
            }
            this.grid.push(row);
            // this.grid.push(new Array(this.height).fill(null));
        }
    }
    public DeleteArrow(arrow: Arrow){
        this.arrows.delete(arrow.Id.toString());
        if(this.arrows.size === 0){
            setTimeout(() => {
                console.warn("No More Arrows, You Win!");
                window.alert("No More Arrows, You Win!");
            }, 1000);
        }
    }
    public AddArrow(arrow: Arrow){
        this.arrows.set(arrow.Id.toString(), arrow);
    }
    public get Grid(){
        return this.grid;
    }
    
    public GetAllCells(): Cell[]{
        return this.grid.flat();
    }
    public GetRandomEmptyCell(): Cell|null{
        let cells = this.grid.flat().filter(cell=>cell.Arrow == null && cell.Rank == 0);
        if(cells.length === 0){
            return null;
        }
        return cells[Math.floor(Rand() * cells.length)];
    }
    public getEmptyCellByRank(rank: number): Cell|null{
        let cells = this.grid.flat().filter(cell=>cell.Rank == rank && cell.Arrow == null);
        if(cells.length === 0){
            return null;
        }
        return cells[Math.floor(Rand() * cells.length)];
    }
    private getNextEmptyCell(prev:Cell,direction: Direction|null,randomness: number = 0.95,rank: number = 0): {direction: Direction, cell: Cell} | null {
        if(direction == null){
            direction = Math.floor(Rand() * 4);
        } else {
            direction =Rand()>randomness? Math.floor(Rand() * 4) : direction;
        }
        let failedCounter = 0;
        let x = prev.Id[0];
        let y = prev.Id[1];
        do{
            let cell = null;
            switch (direction) {
                case Direction.UP:
                    cell = this.grid[x]?.[y-1];
                    if(cell && cell.Arrow == null && cell.Rank <= rank){
                        return {direction, cell};
                    }
                    break;
                case Direction.RIGHT:
                    cell = this.grid[x+1]?.[y];
                    if(cell && cell.Arrow == null && cell.Rank <= rank){
                        return {direction, cell};
                    }
                    break;
                case Direction.DOWN:
                    cell = this.grid[x]?.[y+1];
                    if(cell && cell.Arrow == null && cell.Rank <= rank){
                        return {direction, cell};
                    }
                    break;
                case Direction.LEFT:
                    cell = this.grid[x-1]?.[y];
                    if(cell && cell.Arrow == null && cell.Rank <= rank){
                        return {direction, cell};
                    }
                    break;
                default:
                    break;
            }
            failedCounter++;
            direction = (direction + 1) % 4;
        } while(failedCounter < 4)
        return null;
    }
    public getPeremeterCellsCercular(index: number): Cell[]{
        let perimeterCells =[...this.grid.flat().filter(cell=>{
            let w = Math.abs(cell.Id[0] - props.width/2);
            let h = Math.abs(cell.Id[1] - props.height/2);
            if(w*w + h*h <= index*index){
                return true;
            }
            return false;
            
        })];
        return perimeterCells;
    }
    public getPeremeterCells(index: number): Cell[]{
        let perimeterCells =[...this.grid.flat().filter(cell=>{
            if(cell.Id[0] === index && cell.Id[1] >= index && cell.Id[1] < props.height- index){
                return true;
            }
            if(cell.Id[0] === props.width- index-1 && cell.Id[1] >= index && cell.Id[1] < props.height- index){
                return true;
            }
            if(cell.Id[1] === index && cell.Id[0] >= index && cell.Id[0] < props.width- index){
                return true;
            }
            if(cell.Id[1] === props.height- index-1 && cell.Id[0] >= index && cell.Id[0] < props.width- index){
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
    GenerateArrow(startCell: Cell, length: number,rank: number): Arrow|null{
        // cannot point to an arrow head in the opposite direction (looking at each other)
        // cannot point to its own body
        let nextCell = this.getNextEmptyCell(startCell,null,props.straightness);
        if(nextCell == null){
            return null;
        }
        let arrow = new Arrow(startCell.Id, nextCell.direction,rank);
        // check if the arrow points to an arrow head in the opposite direction (looking at each other)
        let ray = this.getArrowHeadRay(arrow);
        {
            let collidingArrow = ray.find(cell=>cell.Arrow && cell.Arrow.Direction == (arrow.Direction+2)%4 && cell.Arrow.TailCell[0] == cell.Id[0] && cell.Arrow.TailCell[1] == cell.Id[1]);
            if(collidingArrow){
                // console.log("collidingArrow", collidingArrow.Id);
                return null;
            }
            collidingArrow = ray.find(cell=>cell.Arrow );
            // find if arrow points at higher rank or same rank arrow
            
            // ray.forEach(cell=>cell.Rank = arrow.Rank+1);
            for(let cell of ray){
                if(cell.Rank>0 && cell.Rank<=arrow.Rank && cell.Arrow !== null){
                    console.error("collidingArrow lower rank", cell, arrow, rank);
                    return null;
                }
            }
        }
        // arrow is valid
        if(startCell.Rank == 0){
            startCell.Rank = arrow.Rank;
        }
        if(nextCell.cell.Rank == 0){
            nextCell.cell.Rank = arrow.Rank;
        }
        arrow.AddPoint(nextCell.cell.Id);
        nextCell.cell.Arrow = arrow;
        startCell.Arrow = arrow;
        // mark all empty ray cells as ranking one higher than the arrow
        ray.forEach(cell=>{
            if(cell.Rank == 0){
                cell.Rank = arrow.Rank+1;
            }else if(cell.Rank<=arrow.Rank){
                if(cell.Arrow == null) cell.Rank = arrow.Rank+1;
                else return null;
                // cell.invalidate();
            }

        });
        for (let i = 2; i < length; i++) {
            nextCell = this.getNextEmptyCell(nextCell.cell,nextCell.direction,props.straightness,arrow.Rank);
            if(nextCell == null || ray.includes(nextCell.cell)){
                break;
            }
            arrow.AddPoint(nextCell.cell.Id);
            nextCell.cell.Arrow = arrow;
            nextCell.cell.Rank = arrow.Rank;
        }
        return arrow;
    }
    validateArrowHeadCollision(cell: Cell, direction: Direction): boolean{
        if(!cell.Arrow) return false;
        const lastCell = cell.Arrow.Path[cell.Arrow.Path.length-1];
        if(lastCell[0] !== cell.Id[0] || lastCell[1] !== cell.Id[1]) return false;
        if(cell.Arrow.Direction !== direction) return false;
        return true;
    }
    RemoveArrow(arrow: Arrow){
        let path = arrow.Path;
        for (let i = 0; i < path.length; i++) {
            let cell = this.grid[path[i][0]][path[i][1]];
            cell.Arrow = null;
        }
        
    }

    public getArrowHeadRay(arrow: Arrow):Cell[]{
        let direction = (arrow.Direction+2)%4;
        let x = arrow.TailCell[0];
        let y = arrow.TailCell[1];
        let cells:Cell[] = [];
        // console.log("getArrowHeadRay", Direction[direction]);
        switch(direction){
            case Direction.UP:
                y--;
                for(let i = y; i >= 0; i--){
                    cells.push(this.grid[x][i]);
                }
                return cells;
            case Direction.RIGHT:
                x++;
                for(let i = x; i < props.width; i++){
                    cells.push(this.grid[i][y]);
                }
                return cells;
            case Direction.DOWN:
                y++;
                for(let i = y; i < props.height; i++){
                    cells.push(this.grid[x][i]);
                }
                return cells;
            case Direction.LEFT:
                x--;
                for(let i = x; i >= 0; i--){
                    cells.push(this.grid[i][y]);
                }
                return cells;
        }
        return [];
    }
    public Hint(): Arrow|null{
        // get an arrow that is clear to exit
        let arrows = this.arrows.values();
        for(let arrow of arrows){
            if(!arrow.IsBlocked()){
                return arrow;
            }
        }
        return null;
    }
    ValidateLevel(): boolean{
        let grid: boolean[][] = [];
        for (let x = 0; x < this.grid.length; x++) {
            let row = [];
            for (let y = 0; y < this.grid[x].length; y++) {
                row.push(this.grid[x][y].Arrow !== null);
            }
            grid.push(row);
        }
        let arrows = [...this.arrows.values()];
        let counter = 0;
        while(counter<arrows.length ){
            let arrow = arrows[counter];
            if (validateArrowExit(arrow, grid)){
                arrows.splice(counter, 1);
                counter = 0;
                arrow.Color = "orangered";
                arrow.GetPoints().forEach(point=>{
                    grid[point[0]][point[1]] = false;
                });
                continue;
            }
            counter++;
        }
        if(arrows.length > 0){
            for (let x = 0; x < this.grid.length; x++) {
                for (let y = 0; y < this.grid[x].length; y++) {
                    if(grid[x][y]){
                        this.grid[x][y].fillColor("#660000");
                    }
                }
            }
        }
        return arrows.length === 0;

        function validateArrowExit(arrow: Arrow, grid: boolean[][]): boolean{
            let ray = gridPath.getArrowHeadRay(arrow);
            for (const cell of ray) {
                if(grid[cell.Id[0]][cell.Id[1]]){
                    return false;
                }
            }
            return true;
        }
    }
}
enum Direction{
    UP = 0,
    RIGHT = 1,
    DOWN = 2,
    LEFT = 3,
}
class Arrow{
    private color: string = "";
    private id:[number,number];
    private direction: Direction = Direction.UP;
    private path: [number, number][] = [];
    private rank: number;
    private arrowElement: SVGPathElement|null = null;
    private collisionElement: SVGPathElement|null = null;
    private animationStartTime: number = 0;
    private animationSpeed = 150;
    constructor(id: [number, number],direction: Direction, rank: number){
        this.id = id;
        this.direction = direction;
        this.rank = rank;
        this.path.push([...this.id]);
    }
    
    get Path(){
        return [...this.path];
    }
    get Rank(){
        return this.rank;
    }
    get Id(){
        return `${this.id[0]},${this.id[1]}`;
    }
    get Direction(){
        return this.direction;
    }
    set Direction(direction: Direction){
        this.direction = direction;
    }
    get HeadCell(){
        return this.path[0];
    }
    get TailCell(){
        return this.path[this.path.length-1];
    }
    get Color(){
        return this.color;
    }
    set Color(color: string){
        this.color = color;
        if(this.arrowElement) this.arrowElement.style.stroke = this.color;
    }
    AddPoint(point: [number, number]){
        this.path.push(point);
    }
    GetPoints(): [number, number][]{
        return [...this.path];
    }
    private colors = [60,90,120,150,180,210,240,270]
    GetArrowElement(): [SVGPathElement, SVGPathElement]{
        if(this.arrowElement && this.collisionElement) return [this.arrowElement, this.collisionElement];
        let d = this.stringifyBreakPointsToPath(this.path.reverse());
        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arrow.setAttribute("d", d);
        arrow.classList.add("arrowElement");
        // arrow.style.stroke = this._invalid? "#ff0000" : ["#05a","#0089bf","#12a900","#ff7500"][this.direction];
        let colors = [ ];props.maxRank/255;
        for(let i = 0; i < props.maxRank; i++){
            colors.push(`rgb(${Math.round(i/props.maxRank*255)},${Math.round(i/props.maxRank*255)},255)`);
        }

        const color=this.color==""?"#aaa":this.color;
        // arrow.style.stroke = color;
        arrow.style.strokeWidth = props.scale/5+'';
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
        collisionElement.style.strokeWidth = props.scale*1.1+'px';
        collisionElement.addEventListener("click", () => {
            if(mouseUpBlocked) {
                mouseUpBlocked = false;
                return;
            }
            this.ClearToExit();
        });
        collisionElement.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            validateRay(this);
        });
        this.collisionElement = collisionElement;
        return [arrow,collisionElement];
    }
    RemoveForValidation(): void{
        this.collisionElement?.remove();
        this.collisionElement = null;
        gridPath.RemoveArrow(this);
        gridPath.DeleteArrow(this);
    }
    IsBlocked(ray?: Cell[]): boolean{
        if(!ray) ray = gridPath.getArrowHeadRay(this);
        let blocked = ray.some(cell=>cell.Arrow !== null);
        return blocked;
    }
    ClearToExit(){
        let ray = gridPath.getArrowHeadRay(this);
        let blocked = this.IsBlocked(ray);
        if(blocked){
            this.arrowElement?.classList.add("collided");
            return;
        } else {
            this.arrowElement?.classList.remove("collided");
            this.collisionElement?.remove();
            this.collisionElement = null;
            gridPath.RemoveArrow(this);
            this.AnimateArrowExit(ray);
            gridPath.DeleteArrow(this);
        }
        return;
        
    }
    AnimateArrowExit_old(ray: Cell[]){
        if(ray.length === 0){
            animationEnded(this.direction,this);
            return;
        }
        let lastCell:Cell|undefined;
        ray.reverse();
        let interval = setInterval(() => {
            if(ray.length === 0){
                clearInterval(interval);
                animationEnded(this.direction,this);
                return;
            }
            lastCell = ray.pop();
            if(!lastCell) return;
            
            this.path.shift();
            this.path.push(lastCell.Id);
            // newPath.unshift(lastCell.Id);
            let newD = this.stringifyBreakPointsToPath(this.path);
            let d = newD;
            this.arrowElement?.setAttribute("d", d);
            if(ray.length === 0){
                clearInterval(interval);
                animationEnded(this.direction,this);
                return;
            }
        }, 500);
        function animationEnded(dir:Direction,arrow:Arrow){
            let counter = 0;
            let interval = setInterval(() => {
                counter++;
                if(counter > 40){
                    clearInterval(interval);
                    arrow.arrowElement?.remove();
                    arrow.arrowElement = null;
                    console.warn("animationEnded Arrow Removed", arrow);
                    
                    return;
                }
                arrow.path.shift();
                let x = arrow.path[arrow.path.length-1][0];
                let y = arrow.path[arrow.path.length-1][1];
                switch(dir){
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
                arrow.path.push([x,y]);
                let d = arrow.stringifyBreakPointsToPath(arrow.path);
                arrow.arrowElement?.setAttribute("d", d);

            }, 50);

        }
        
    }
    AnimateArrowExit(ray: Cell[]){
        ray.reverse();
        this.AnimateArrowExitSection(ray);
    }
    AnimateArrowExitSection(ray: Cell[]){
        if(ray.length === 0) {
            this.AnimateArrowExitOutofview();
            return;
        }
        // console.log("AnimateArrowExitSection", ray);
        let lastCell = ray.pop();
        if(!lastCell) return;
        const newPath = [...this.path];
        newPath.shift();
        newPath.push(lastCell.Id);
        // this.arrowElement?.setAttribute('d', this.stringifyBreakPointsToPath(newPath));
        // return;
        this.arrowElement?.setAttribute('data-animate-to', JSON.stringify(newPath));
        this.arrowElement?.setAttribute('data-animate-from', JSON.stringify(this.path));
        this.animationStartTime = performance.now();
        this.animationSpeed = Math.max(this.animationSpeed * 0.8, 30);
        
        this.animate(this,ray);
        
    }
    exitCounter=0;
    AnimateArrowExitOutofview(){
        this.exitCounter++;
        if(this.exitCounter > 100) {
            this.arrowElement?.remove();
            this.arrowElement = null;
            // console.warn("AnimateArrowExitOutofview Arrow Removed", this);
            
            return;
        }

        let lastCell = this.path[this.path.length-1];
        lastCell = [...lastCell];
        switch(this.direction){
            case Direction.UP:
                lastCell[1]+=1;
                break;
            case Direction.LEFT:
                lastCell[0]+=1;
                break;
            case Direction.DOWN:
                lastCell[1]-=1;
                break;
            case Direction.RIGHT:
                lastCell[0]-=1;
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
        
        this.animate(this,[]);
    }
    animate(arrow: Arrow,ray: Cell[]){
        return requestAnimationFrame(() => {
            let timePassed = performance.now() - arrow.animationStartTime;
            let progress = timePassed / arrow.animationSpeed;
            let from = JSON.parse(arrow.arrowElement?.getAttribute('data-animate-from') ?? '[]');
            let to = JSON.parse(arrow.arrowElement?.getAttribute('data-animate-to') ?? '[]');
            let fc = 0;
            let lc = from.length-1;
            
            from[fc][0] = from[fc][0] + (to[fc][0] - from[fc][0]) * progress;
            from[fc][1] = from[fc][1] + (to[fc][1] - from[fc][1]) * progress;
            
            from[lc][0] = from[lc][0] + (to[lc][0] - from[lc][0]) * progress;
            from[lc][1] = from[lc][1] + (to[lc][1] - from[lc][1]) * progress;
            
            arrow.arrowElement?.setAttribute('d', arrow.stringifyBreakPointsToPath(from));
            // console.log("animate", progress);
            if(progress < 1){
                arrow.animate(arrow,ray);
            } else {
                arrow.path = to;
                arrow.AnimateArrowExitSection(ray);
            }
        });
    }

    

    private stringifyBreakPointsToPath(breakPoints: any[]) {
        if (!breakPoints) return "";
        function distance(a: number[], b: number[]) {
            return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
        }
        function pointFromDistance(a: number[], b: number[], dist: number) {
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
        let points = breakPoints.map((bp: number[]) => ([(bp[0] + props.offset) * props.scale + (Rand() * props.jiggle - props.jiggle / 2), (bp[1] + props.offset) * props.scale + (Rand() * props.jiggle - props.jiggle / 2)]));
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
    private id: [number, number];
    private idstr: string;
    private arrow: Arrow | null;
    private rank: number = 0;
    

    element: SVGGElement | null = null;
    squareElement: SVGRectElement | null = null;
    textElement: SVGTextElement | null = null;
    constructor(id: [number, number], arrow: Arrow | null){
        this.id = id;
        this.idstr = `${id[0]},${id[1]}`;
        this.arrow = arrow;
        this.Element;
    }
    public get Rank(): number{
        return this.rank;
    }
    public set Rank(rank: number){
        this.rank = rank;
        this.TextElement;
    }
    get Id(){
        return this.id;
    }
    get Arrow(): Arrow | null{
        return this.arrow;
    }
    set Arrow(arrow: Arrow | null){
        this.arrow = arrow;
    }
    private get Element(): SVGGElement{
        if(this.element) {
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

        if(gridGroup) gridGroup.appendChild(element);
        return element;
    }
    private get TextElement(): SVGTextElement{
        if(this.textElement){
            this.textElement.textContent = this.Rank == 0?"":this.Rank.toString();
            this.textElement.setAttribute("fill", `rgb(${Math.round(this.Rank/props.maxRank*255)},${Math.round(this.Rank/props.maxRank*255)},255)`);
            return this.textElement;
        }
        this.textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        this.textElement.setAttribute("x", "0");
        this.textElement.setAttribute("y", "0");
        this.textElement.setAttribute("text-anchor", "middle");
        this.textElement.setAttribute("dominant-baseline", "middle");
        this.textElement.setAttribute("font-size", props.scale/2+'');
        this.textElement.setAttribute("fill", `rgb(${Math.round(this.Rank/props.maxRank*255)},${Math.round(this.Rank/props.maxRank*255)},255)`);
        this.textElement.style.transform = `translate(${props.scale/2}px,${props.scale/2}px)`;
        this.textElement.textContent = this.Rank == 0?"":this.Rank.toString();
        return this.textElement;
    }
    invalidate(){
        this.Rank = 0;
        this.TextElement;
        this.squareElement?.setAttribute("fill", "red");
    }
    fillColor(color: string){
        this.squareElement?.setAttribute("fill", color);
    }
}
// var gridPath = new GridPath();
// console.log(gridPath.getRandomEmptyCellEdge());