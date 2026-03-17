let debugText = document.getElementById("debug") as HTMLTextAreaElement;
let _consoleLog = console.log;
let _consoleWarn = console.warn;
let _consoleError = console.error;

const err = console.error;
const warn = console.warn;
const log = console.log;

// console.log = (...args: any[]) => {
//     _consoleLog(...args);
//     debugText.value += "--LOG: ";
//     for(const arg of args){
//         if(typeof arg === "object"){
//             debugText.value += JSON.stringify(arg, null, 4) + "\t";
//         } else {
//             debugText.value += arg + "\t";
//         }
//     }
//     debugText.value += "\n\n";
//     debugText.scrollTop = debugText.scrollHeight;
// }   
// console.warn = (...args: any[]) => {
//     _consoleWarn(...args);
//     debugText.value += "--WARN: ";
//     for(const arg of args){
//         if(typeof arg === "object"){
//             debugText.value += JSON.stringify(arg, null, 4) + "\t";
//         } else {
//             debugText.value += arg + "\t";
//         }
//     }
//     debugText.value += "\n\n";
//     debugText.scrollTop = debugText.scrollHeight;
// }
// console.error = (...args: any[]) => {
//     _consoleError(...args);
//     debugText.value += "--ERROR: ";
//     for(const arg of args){
//         if(typeof arg === "object"){
//             debugText.value += JSON.stringify(arg, null, 4) + "\t";
//         } else {
//             debugText.value += arg + "\t";
//         }
//     }
//     debugText.value += "\n\n";
//     debugText.scrollTop = debugText.scrollHeight;
// }
namespace Main {

    const DELAY_TIME = 100;
    export const svg = document.getElementById("svg");
    let rootGroup: SVGGElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    rootGroup.classList.add("rootGroup");
    export let gridGroup: SVGGElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gridGroup.classList.add("gridGroup");
    export let arrowGroup: SVGGElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    arrowGroup.classList.add("arrowGroup");
    rootGroup.appendChild(gridGroup);
    rootGroup.appendChild(arrowGroup);
    svg?.appendChild(rootGroup);
    document.getElementById("arrow-head")?.setAttribute("markerHeight", Math.max(6, props.scale / 6) + '');
    export let gridPath = new GridPath();

    export function PromisedDelay(ms: number, msg: string) {
        // console.warn("promisedDelay "+msg);
        // debugger;
        return new Promise(resolve => setTimeout(resolve, ms));
        // return Promise.resolve();
    }
    function isValidDirection(ray: Cell[], direction: Direction): boolean {
        return !ray.some(c=>c.Arrow && c.Arrow.Direction == (direction+2)%4);
    }
    function getBody(cell: Cell, nextCell: Cell, ray: Cell[]): Cell[] {
        let body: Cell[] = [cell, nextCell];
        let holdRayCells = [];
        for(const cell of ray){
            if(!cell.Arrow && cell.Rank >=0) {
                cell.Rank = -2;
                holdRayCells.push(cell);
            }
        }
        let currCell = nextCell;
        cell.Rank = -2;
        nextCell.Rank = -2;
        holdRayCells.push(cell, nextCell);
        while(currCell && body.length < props.maxLength){
            let nextCell = gridPath.findNextEmptyCell(currCell);
            if(!nextCell) break;
            if(nextCell.cell.Rank >=0) nextCell.cell.Rank = -2;
            holdRayCells.push(nextCell.cell);
            body.push(nextCell.cell);
            currCell = nextCell.cell;
        }
        if(body.length == 1){
            body[0].Rank = -1;
            if(body[0].textElement) body[0].textElement.style.fill = "white";
            if(body[0].squareElement) body[0].squareElement.style.fill = "firebrick";
            body = [];
        }
        for(const cell of holdRayCells){
            cell.RevertRank();
        }
        return body;

    }
    function generateArrow(cell:Cell,nextCell: Cell,dir:Direction,baseRank: number = 10): Arrow | null {
        let ray = gridPath.getCellRay(cell, dir as Direction);
        ray.forEach(c=>c.fillColor("lightgreen"));
        if(ray.some(c=>c.Arrow && c.Arrow.Direction == (dir+2)%4)){
            ray.forEach(c=>c.fillColor("none"));
            return null;
        }
        
        let body = getBody(cell, nextCell, ray);
        if(body.length == 0) return null;
        body.forEach(c=>c.fillColor("darkorange"));
        let maxRank = body.reduce((max, cell) => Math.max(max, cell.Rank), baseRank);
        if(ray.some(c=>c.Arrow && c.Rank <= maxRank)) return null;
        // arrow is valid
        let arrow = new Arrow([...cell.Id], dir as Direction, maxRank);        
        for (const cell of body) {
            cell.Rank = maxRank; 
            cell.Arrow = arrow;
            arrow.AddPoint([...cell.Id]);
        }
        let [arrowElement, collisionElement] = arrow.GetArrowElement();
        arrowGroup?.appendChild(collisionElement);
        arrowGroup?.appendChild(arrowElement);
        gridPath.AddArrow(arrow);
        for(const cell of ray){
            if(!cell.Arrow) cell.Rank = maxRank+1;
        }
        return arrow;
    }
    async function GenerateMap() {
        let arrowsCreated = 0;
        // get all empty cells
        let cells = gridPath.GetAllCells();
        cells.sort(()=>Rand()*2-1);
        let count = cells.length*2;
        let dirs = [0,1,2,3].sort(()=>Rand()*2-1);

        for (let i = 0; i < count && cells.length > 0; i++) {
            const cell = cells.pop() as Cell;
            if(!cell) break;
            
            // debugger;
    
            let arrow: Arrow | null = null;
            if(Rand()>props.straightness)
                dirs.sort(()=>Rand()*2-1);
            for(let dir of dirs){
                let nextCell = gridPath.findNextEmptyCell(cell,(dir+2)%4 as Direction);
                if(!nextCell) continue;
                dir = (nextCell.direction+2)%4 as Direction;
                cell.fillColor("blue");
                nextCell.cell.fillColor("lightblue");
                arrow = generateArrow(cell, nextCell.cell, dir, 10);
                gridPath.GetAllCells().forEach(cell=>cell.fillColor("none"));
                if(arrow) {
                    arrowsCreated++;
                    break;
                }
            }
            cells = cells.filter(cell=>cell.Arrow == null && cell.Rank >=0);
        }
        gridPath.GetAllCells().forEach(cell=>cell.fillColor("none"));
        console.log("arrowsCreated", arrowsCreated);
        // fill empty regions
        cells = gridPath.GetEmptyCells();
        const regions = [];
        while(cells.length > 0) {
            let cell = cells.pop() as Cell;
            cell = gridPath.Grid[(cell as any).id[0]][(cell as any).id[1]];
            if(!cell) continue;
            let region = gridPath.getEmptyRegion(cell);
            if(region.region.length == 1){
                cell.Rank = -1;
                if (cell.textElement) cell.textElement.style.fill = "white";
                if (cell.squareElement) cell.squareElement.style.fill = "firebrick";
                continue;
            }
            regions.push(region);
            for (const cell of region.region) {
                if(cells.includes(cell)) {
                    cells.splice(cells.indexOf(cell), 1);
                }
            }
        }
        for (const region of regions) {
            cells = [...region.region.sort(()=>Rand()*2-1),...region.edge.sort(()=>Rand()*2-1)];
            while(cells.length > 0) {
                let cell = cells.pop() as Cell;
                let nextCell = gridPath.findNextEmptyCell(cell);
                if(!nextCell) {
                    err("SOMETHING IS WRONG! No next cell found for cell", cell);
                    continue;
                }
                let dir = (nextCell.direction+2)%4 as Direction;
                cell.fillColor("blue");
                nextCell.cell.fillColor("lightblue");
                let arrow = generateArrow(cell, nextCell.cell, dir, 1);
                gridPath.GetAllCells().forEach(cell=>cell.fillColor("none"));
                if(arrow) {
                    arrowsCreated++;
                    break;
                }
            }
            // if (arrow) {
            //     arrowsCreated++;
            // } else {
            //     err("No arrow found! Failed to generate arrow for region", region);
            //     region.region.forEach(cell => {
            //         cell.Rank = -1;
            //         if (cell.textElement) cell.textElement.style.fill = "white";
            //         if (cell.squareElement) cell.squareElement.style.fill = "purple";
            //     });
            // }
        }

        // let cell = gridPath.getEmptyCellByRank(0);
        // let counter = 0;
        // arrowsCreated = 0;
        // while (cell && counter < 100) {
        //     counter++;
        //     let region = gridPath.getEmptyRegion(cell);
        //     console.log("region", region);
        //     let arrow = await PlaceArrowForRegion(region);
        //     if (arrow) {
        //         counter = 0;
        //         arrowsCreated++;
        //     } else {
        //         region.region.forEach(cell => {
        //             cell.Rank = -1;
        //             if (cell.textElement) cell.textElement.style.fill = "white";
        //             if (cell.squareElement) cell.squareElement.style.fill = "purple";
        //         });
        //     }
        //     cell = gridPath.getEmptyCellWithRank();
        // }
        console.log("arrowsCreated from regions", arrowsCreated);

    }
    async function PlaceArrowForRegion(region: { region: Cell[], edge: Cell[] }) {

        if (region.region.length == 1) {
            let cell = region.region[0];
            cell.Rank = -1;
            if (cell.textElement) cell.textElement.style.fill = "white";
            if (cell.squareElement) cell.squareElement.style.fill = "firebrick";
            return null;
        }

        if (region.edge.length !== 0) {
            region.edge.sort(() => Rand() * 2 - 1);
        }

        while (region.edge.length > 0) {
            let cell = region.edge.pop() as Cell;
            let arrow = await placeArrow(cell, 1);
            if (!arrow) {
                // console.warn("No arrow found! Failed to generate arrow for region", cell, region);
                continue;
            }
            else {
                return arrow;
            }
        }
        console.warn("No arrow found in edge cell!", region);
        region.region.sort(() => Rand() * 2 - 1);
        while (region.region.length > 0) {
            let cell = region.region.pop() as Cell;
            let arrow = await placeArrow(cell, 1);
            if (!arrow) {
                // console.warn("No arrow found! Failed to generate arrow for region", cell, region);
                continue;
            }
            else {
                return arrow;
            }
        }
        // could not create arrow for region
        // mark entire region as blocked
        region.region.forEach(cell => {
            cell.Rank = -1;
            if (cell.textElement) cell.textElement.style.fill = "white";
            if (cell.squareElement) cell.squareElement.style.fill = "firebrick";
        });
        return null;



    }

    // let arrows: SVGPathElement[] = [];
    export async function draw() {

        if (!arrowGroup) {
            arrowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            arrowGroup.classList.add("arrowGroup");
        } else {
            arrowGroup.innerHTML = "";
        }
        rootGroup.appendChild(arrowGroup);
        await GenerateMap();

        centersvg();

    }
    async function placeArrow(cell: Cell, rank: number) {
        let arrow = await gridPath.GenerateArrow(cell, props.maxLength, rank);
        if (arrow) {
            let [arrowElement, collisionElement] = arrow.GetArrowElement();
            arrowGroup?.appendChild(collisionElement);
            arrowGroup?.appendChild(arrowElement);
            gridPath.AddArrow(arrow);
        }
        return arrow;
    }
    async function placeStartingArrow() {
        // await promisedDelay(DELAY_TIME);

        // console.log("placeStartingArrow");
        let cell = gridPath.GetRandomEmptyCell();
        if (!cell) {
            console.error("No empty cell found! Failed to generate starting arrow!");
            // alert("No empty cell found! Failed to generate starting arrow!");
            return undefined;
        }

        let arrow = await placeArrow(cell, 1);
        if (!arrow) {
            console.error("No arrow found! Failed to generate starting arrow!", cell);
            return null;
        }
        await placeFollowingArrows();
        return arrow;
    }
    export async function placeFollowingArrows() {
        let counter = 0;
        let cell = gridPath.getEmptyCellWithRank();
        if (!cell) {
            console.warn("No empty cell for next rank");
            return;
        }
        let arrow: Arrow | null = null;
        while (cell) {
            counter++;
            arrow = await placeArrow(cell, 2);
            if (!arrow) {
                console.warn("No arrow found! Failed to generate arrow for rank", cell, counter);
            }
            if (counter > 100) {
                console.error("Failed to generate arrow for rank", cell, counter);
                return;
            }
            cell = gridPath.getEmptyCellWithRank();
        }
    }
    
    export function restart() {
        [...rootGroup.children].forEach(child => child.remove());
        rngSeed = (document.getElementById("level") as HTMLInputElement)?.valueAsNumber ?? 1;
        if (rngSeed == 0) {
            rngSeed = Math.floor(Math.random() * 4836651);
        }
        props.level = (document.getElementById("level") as HTMLInputElement)?.valueAsNumber ?? 1;
        props.width = (document.getElementById("width") as HTMLInputElement)?.valueAsNumber ?? 20;
        props.height = (document.getElementById("height") as HTMLInputElement)?.valueAsNumber ?? 20;
        props.maxLength = (document.getElementById("maxLength") as HTMLInputElement)?.valueAsNumber ?? 20;
        props.jiggle = (document.getElementById("jiggle") as HTMLInputElement)?.valueAsNumber ?? 0;
        props.straightness = (document.getElementById("straightness") as HTMLInputElement)?.valueAsNumber ?? 0.95;
        localStorage.setItem("props", JSON.stringify(props));
        rngSeed = props.level > 0 ? props.level : Math.floor(Math.random() * 4836651);
        window.location.hash = `level=${rngSeed}`;


        // drawGrid(props.width, props.height);
        // if(svg){
        //     // inner width

        //     svg.style.width = "100%";
        //     svg.style.height = "100%";
        // }
        gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gridGroup.classList.add("gridGroup");
        rootGroup.appendChild(gridGroup);
        gridPath = new GridPath();
        draw();
    }
    export function hint() {
        let arrow = gridPath.Hint();
        if (!arrow) return;
        arrow.Color = "pink";
        arrow.GetArrowElement()[1].style.stroke = "pink";
    }
    export function validateLevel() {
        let valid = gridPath.ValidateLevel();
        console.log(valid);
        if (valid) {
            // document.getElementById("RestartButton")?.click();
            alert("Level is valid!");
        } else {
            alert("Level is invalid!");
        }

    }
    function centersvg() {
        let rect = svg?.getBoundingClientRect();
        if (!rect) return;
        const tX = rect.width / 2 - (props.width * props.scale) / 2;
        const tY = rect.height / 2 - (props.height * props.scale) / 2;
        // console.log({tX,tY});
        // console.log(props.width * props.scale,props.height * props.scale);
        // console.log(rootGroup.getBoundingClientRect());
        // console.log(rect);

        rootGroup.style.transform = `translate(${tX}px,${tY}px)`;
        (rootGroup as any).dataTX = tX;
        (rootGroup as any).dataTY = tY;
    }
    export function validateRay(arrow: Arrow) {
        gridPath.GetAllCells().forEach(cell => {
            cell.fillColor("none");
        });

        let ray = gridPath.getArrowHeadRay(arrow);
        ray.forEach(cell => {
            cell.fillColor("green");
        });
    }
    export let dragging = false;
    let dragX = 0;
    let dragY = 0;
    export let mouseUpBlocked = false;

    export const mouseMoveEvent = (clientX: number, clientY: number, buttons: number) => {
        // console.log(e.buttons, dragging);
        if (buttons !== 1) {
            if (dragging) {
                let tX = (rootGroup as any).dataTX ?? 0;
                let tY = (rootGroup as any).dataTY ?? 0;
                (rootGroup as any).dataTX = tX + clientX - dragX;
                (rootGroup as any).dataTY = tY + clientY - dragY;
                dragX = clientX;
                dragY = clientY;
            }
            dragging = false;
            return;
        }
        if (!dragging) {
            dragging = true;
            dragX = clientX;
            dragY = clientY;
            return;
        }
        if (dragging) {
            let rect = svg?.getBoundingClientRect();
            let tX = ((rootGroup as any).dataTX ?? 0) + clientX - dragX;
            let tY = ((rootGroup as any).dataTY ?? 0) + clientY - dragY;
            if (rect) {
                let gw = rootGroup?.getBoundingClientRect()?.width ?? 0;
                let gh = rootGroup?.getBoundingClientRect()?.height ?? 0;
                tX = Math.max((gw - 10) * -1, Math.min(tX, rect.width - 10));
                tY = Math.max((gh - 10) * -1, Math.min(tY, rect.height - 10));
            }
            if (rootGroup) rootGroup.style.transform = `translate(${tX}px,${tY}px)`;
        }
    }
    export const mouseUpEvent = (clientX: number, clientY: number) => {
        if (dragging) {

            let tX = (rootGroup as any).dataTX ?? 0;
            let tY = (rootGroup as any).dataTY ?? 0;
            (rootGroup as any).dataTX = tX + clientX - dragX;
            (rootGroup as any).dataTY = tY + clientY - dragY;
            dragX = clientX;
            dragY = clientY;
            mouseUpBlocked = (Math.abs(clientX - dragX) + Math.abs(clientY - dragY) <= 5);
        }
        dragging = false;
    }
    // iframe.contentWindow.postMessage({type: "click", x: x, y: y}, "*");
}
const zoomEvCache: PointerEvent[] = [];
let prevDiff = -1;
Main.svg?.addEventListener("pointerdown", (ev) => {
    zoomEvCache.push(ev);
}, {
    // capture: true,
});
Main.svg?.addEventListener("pointermove", (ev) => {
    // const index = zoomEvCache.findIndex(e=>e.pointerId === ev.pointerId);
    // if(index !== -1){
    //     zoomEvCache[index] = ev;
    // }
    // if(zoomEvCache.length === 2){
    //     // two pointers are down, calculate the distance between them and prevent touch events
    //     const curDiff = Math.hypot(
    //         zoomEvCache[0].clientX - zoomEvCache[1].clientX,
    //         zoomEvCache[0].clientY - zoomEvCache[1].clientY,
    //     );
    //     if (prevDiff > 0) {
    //         if (curDiff > prevDiff) {
    //             document.body.style.backgroundColor = "pink";
    //         }
    //         if (curDiff < prevDiff) {
    //             document.body.style.backgroundColor = "lightblue";
    //         }
    //         prevDiff = curDiff;
    //     }
    // } else {
    Main.mouseMoveEvent(ev.clientX, ev.clientY, ev.buttons);
    // }
    // ev.preventDefault();
    // ev.stopPropagation();
}, {
    capture: true,
});
//pointerup, pointercancel, pointerout, pointerleave have the same effect
function pointerUpHandler(ev: PointerEvent) {
    if (Main.dragging) {
        ev.preventDefault();
        ev.stopPropagation();
        Main.mouseUpEvent(ev.clientX, ev.clientY);
    }
    // const index = zoomEvCache.findIndex(
    //     (cachedEv) => cachedEv.pointerId === ev.pointerId,
    // );
    // zoomEvCache.splice(index, 1);
    // if(zoomEvCache.length !== 2){
    //     prevDiff = -1;
    // }
}
Main.svg?.addEventListener("pointerup", pointerUpHandler, {
    capture: true,
});
Main.svg?.addEventListener("pointercancel", pointerUpHandler, {
    capture: true,
});
Main.svg?.addEventListener("pointerout", pointerUpHandler, {
    capture: true,
});
Main.svg?.addEventListener("pointerleave", pointerUpHandler, {
    capture: true,
});
// window.addEventListener("message", (event) => {
//     console.log(event);
//     switch(event.data.type){
//         case "click":
//             // window.dispatchEvent(new MouseEvent("click", {
//             //     clientX: event.data.x,
//             //     clientY: event.data.y,
//             //     buttons: 1,
//             // }));
//             (window.document.elementsFromPoint(event.data.x, event.data.y)
//             .find(element=>element.classList.contains("collisionElement")) as HTMLElement)
//             ?.dispatchEvent(new MouseEvent("click", {
//                     clientX: event.data.x,
//                     clientY: event.data.y,
//                     buttons: 1,
//                 }));
//             break;
//         case "mousemove":
//             mouseMoveEvent(event.data.x, event.data.y, 1);
//             break;
//         case "mouseup":
//             mouseUpEvent(event.data.x, event.data.y);
//             break;
//         case "mousedown":
//             window.dispatchEvent(new MouseEvent("mousedown", {
//                 clientX: event.data.x,
//                 clientY: event.data.y,
//             }));
//             break;
//     }
// });
window.addEventListener('load', () => {
    Main.draw();
});