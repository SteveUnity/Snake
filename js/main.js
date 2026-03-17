"use strict";
let debugText = document.getElementById("debug");
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
var Main;
(function (Main) {
    const DELAY_TIME = 100;
    Main.svg = document.getElementById("svg");
    let rootGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    rootGroup.classList.add("rootGroup");
    Main.gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    Main.gridGroup.classList.add("gridGroup");
    Main.arrowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    Main.arrowGroup.classList.add("arrowGroup");
    rootGroup.appendChild(Main.gridGroup);
    rootGroup.appendChild(Main.arrowGroup);
    Main.svg?.appendChild(rootGroup);
    document.getElementById("arrow-head")?.setAttribute("markerHeight", Math.max(6, props.scale / 6) + '');
    Main.gridPath = new GridPath();
    function PromisedDelay(ms, msg) {
        // console.warn("promisedDelay "+msg);
        // debugger;
        return new Promise(resolve => setTimeout(resolve, ms));
        // return Promise.resolve();
    }
    Main.PromisedDelay = PromisedDelay;
    function isValidDirection(ray, direction) {
        return !ray.some(c => c.Arrow && c.Arrow.Direction == (direction + 2) % 4);
    }
    function getBody(cell, nextCell, ray) {
        let body = [cell, nextCell];
        let holdRayCells = [];
        for (const cell of ray) {
            if (!cell.Arrow && cell.Rank >= 0) {
                cell.Rank = -2;
                holdRayCells.push(cell);
            }
        }
        let currCell = nextCell;
        cell.Rank = -2;
        nextCell.Rank = -2;
        holdRayCells.push(cell, nextCell);
        while (currCell && body.length < props.maxLength) {
            let nextCell = Main.gridPath.findNextEmptyCell(currCell);
            if (!nextCell)
                break;
            if (nextCell.cell.Rank >= 0)
                nextCell.cell.Rank = -2;
            holdRayCells.push(nextCell.cell);
            body.push(nextCell.cell);
            currCell = nextCell.cell;
        }
        if (body.length == 1) {
            body[0].Rank = -1;
            if (body[0].textElement)
                body[0].textElement.style.fill = "white";
            if (body[0].squareElement)
                body[0].squareElement.style.fill = "firebrick";
            body = [];
        }
        for (const cell of holdRayCells) {
            cell.RevertRank();
        }
        return body;
    }
    function generateArrow(cell, nextCell, dir, baseRank = 10) {
        let ray = Main.gridPath.getCellRay(cell, dir);
        ray.forEach(c => c.fillColor("lightgreen"));
        if (ray.some(c => c.Arrow && c.Arrow.Direction == (dir + 2) % 4)) {
            ray.forEach(c => c.fillColor("none"));
            return null;
        }
        let body = getBody(cell, nextCell, ray);
        if (body.length == 0)
            return null;
        body.forEach(c => c.fillColor("darkorange"));
        let maxRank = body.reduce((max, cell) => Math.max(max, cell.Rank), baseRank);
        if (ray.some(c => c.Arrow && c.Rank <= maxRank))
            return null;
        // arrow is valid
        let arrow = new Arrow([...cell.Id], dir, maxRank);
        for (const cell of body) {
            cell.Rank = maxRank;
            cell.Arrow = arrow;
            arrow.AddPoint([...cell.Id]);
        }
        let [arrowElement, collisionElement] = arrow.GetArrowElement();
        Main.arrowGroup?.appendChild(collisionElement);
        Main.arrowGroup?.appendChild(arrowElement);
        Main.gridPath.AddArrow(arrow);
        for (const cell of ray) {
            if (!cell.Arrow)
                cell.Rank = maxRank + 1;
        }
        return arrow;
    }
    async function GenerateMap() {
        let arrowsCreated = 0;
        // get all empty cells
        let cells = Main.gridPath.GetAllCells();
        cells.sort(() => Rand() * 2 - 1);
        let count = cells.length * 2;
        let dirs = [0, 1, 2, 3].sort(() => Rand() * 2 - 1);
        for (let i = 0; i < count && cells.length > 0; i++) {
            const cell = cells.pop();
            if (!cell)
                break;
            // debugger;
            let arrow = null;
            if (Rand() > props.straightness)
                dirs.sort(() => Rand() * 2 - 1);
            for (let dir of dirs) {
                let nextCell = Main.gridPath.findNextEmptyCell(cell, (dir + 2) % 4);
                if (!nextCell)
                    continue;
                dir = (nextCell.direction + 2) % 4;
                cell.fillColor("blue");
                nextCell.cell.fillColor("lightblue");
                arrow = generateArrow(cell, nextCell.cell, dir, 10);
                Main.gridPath.GetAllCells().forEach(cell => cell.fillColor("none"));
                if (arrow) {
                    arrowsCreated++;
                    break;
                }
            }
            cells = cells.filter(cell => cell.Arrow == null && cell.Rank >= 0);
        }
        Main.gridPath.GetAllCells().forEach(cell => cell.fillColor("none"));
        console.log("arrowsCreated", arrowsCreated);
        // fill empty regions
        cells = Main.gridPath.GetEmptyCells();
        const regions = [];
        while (cells.length > 0) {
            let cell = cells.pop();
            cell = Main.gridPath.Grid[cell.id[0]][cell.id[1]];
            if (!cell)
                continue;
            let region = Main.gridPath.getEmptyRegion(cell);
            if (region.region.length == 1) {
                cell.Rank = -1;
                if (cell.textElement)
                    cell.textElement.style.fill = "white";
                if (cell.squareElement)
                    cell.squareElement.style.fill = "firebrick";
                continue;
            }
            regions.push(region);
            for (const cell of region.region) {
                if (cells.includes(cell)) {
                    cells.splice(cells.indexOf(cell), 1);
                }
            }
        }
        for (const region of regions) {
            cells = [...region.region.sort(() => Rand() * 2 - 1), ...region.edge.sort(() => Rand() * 2 - 1)];
            while (cells.length > 0) {
                let cell = cells.pop();
                let nextCell = Main.gridPath.findNextEmptyCell(cell);
                if (!nextCell) {
                    err("SOMETHING IS WRONG! No next cell found for cell", cell);
                    continue;
                }
                let dir = (nextCell.direction + 2) % 4;
                cell.fillColor("blue");
                nextCell.cell.fillColor("lightblue");
                let arrow = generateArrow(cell, nextCell.cell, dir, 1);
                Main.gridPath.GetAllCells().forEach(cell => cell.fillColor("none"));
                if (arrow) {
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
    async function PlaceArrowForRegion(region) {
        if (region.region.length == 1) {
            let cell = region.region[0];
            cell.Rank = -1;
            if (cell.textElement)
                cell.textElement.style.fill = "white";
            if (cell.squareElement)
                cell.squareElement.style.fill = "firebrick";
            return null;
        }
        if (region.edge.length !== 0) {
            region.edge.sort(() => Rand() * 2 - 1);
        }
        while (region.edge.length > 0) {
            let cell = region.edge.pop();
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
            let cell = region.region.pop();
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
            if (cell.textElement)
                cell.textElement.style.fill = "white";
            if (cell.squareElement)
                cell.squareElement.style.fill = "firebrick";
        });
        return null;
    }
    // let arrows: SVGPathElement[] = [];
    async function draw() {
        if (!Main.arrowGroup) {
            Main.arrowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            Main.arrowGroup.classList.add("arrowGroup");
        }
        else {
            Main.arrowGroup.innerHTML = "";
        }
        rootGroup.appendChild(Main.arrowGroup);
        await GenerateMap();
        centersvg();
    }
    Main.draw = draw;
    async function placeArrow(cell, rank) {
        let arrow = await Main.gridPath.GenerateArrow(cell, props.maxLength, rank);
        if (arrow) {
            let [arrowElement, collisionElement] = arrow.GetArrowElement();
            Main.arrowGroup?.appendChild(collisionElement);
            Main.arrowGroup?.appendChild(arrowElement);
            Main.gridPath.AddArrow(arrow);
        }
        return arrow;
    }
    async function placeStartingArrow() {
        // await promisedDelay(DELAY_TIME);
        // console.log("placeStartingArrow");
        let cell = Main.gridPath.GetRandomEmptyCell();
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
    async function placeFollowingArrows() {
        let counter = 0;
        let cell = Main.gridPath.getEmptyCellWithRank();
        if (!cell) {
            console.warn("No empty cell for next rank");
            return;
        }
        let arrow = null;
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
            cell = Main.gridPath.getEmptyCellWithRank();
        }
    }
    Main.placeFollowingArrows = placeFollowingArrows;
    function restart() {
        [...rootGroup.children].forEach(child => child.remove());
        rngSeed = document.getElementById("level")?.valueAsNumber ?? 1;
        if (rngSeed == 0) {
            rngSeed = Math.floor(Math.random() * 4836651);
        }
        props.level = document.getElementById("level")?.valueAsNumber ?? 1;
        props.width = document.getElementById("width")?.valueAsNumber ?? 20;
        props.height = document.getElementById("height")?.valueAsNumber ?? 20;
        props.maxLength = document.getElementById("maxLength")?.valueAsNumber ?? 20;
        props.jiggle = document.getElementById("jiggle")?.valueAsNumber ?? 0;
        props.straightness = document.getElementById("straightness")?.valueAsNumber ?? 0.95;
        localStorage.setItem("props", JSON.stringify(props));
        rngSeed = props.level > 0 ? props.level : Math.floor(Math.random() * 4836651);
        window.location.hash = `level=${rngSeed}`;
        // drawGrid(props.width, props.height);
        // if(svg){
        //     // inner width
        //     svg.style.width = "100%";
        //     svg.style.height = "100%";
        // }
        Main.gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        Main.gridGroup.classList.add("gridGroup");
        rootGroup.appendChild(Main.gridGroup);
        Main.gridPath = new GridPath();
        draw();
    }
    Main.restart = restart;
    function hint() {
        let arrow = Main.gridPath.Hint();
        if (!arrow)
            return;
        arrow.Color = "pink";
        arrow.GetArrowElement()[1].style.stroke = "pink";
    }
    Main.hint = hint;
    function validateLevel() {
        let valid = Main.gridPath.ValidateLevel();
        console.log(valid);
        if (valid) {
            // document.getElementById("RestartButton")?.click();
            alert("Level is valid!");
        }
        else {
            alert("Level is invalid!");
        }
    }
    Main.validateLevel = validateLevel;
    function centersvg() {
        let rect = Main.svg?.getBoundingClientRect();
        if (!rect)
            return;
        const tX = rect.width / 2 - (props.width * props.scale) / 2;
        const tY = rect.height / 2 - (props.height * props.scale) / 2;
        // console.log({tX,tY});
        // console.log(props.width * props.scale,props.height * props.scale);
        // console.log(rootGroup.getBoundingClientRect());
        // console.log(rect);
        rootGroup.style.transform = `translate(${tX}px,${tY}px)`;
        rootGroup.dataTX = tX;
        rootGroup.dataTY = tY;
    }
    function validateRay(arrow) {
        Main.gridPath.GetAllCells().forEach(cell => {
            cell.fillColor("none");
        });
        let ray = Main.gridPath.getArrowHeadRay(arrow);
        ray.forEach(cell => {
            cell.fillColor("green");
        });
    }
    Main.validateRay = validateRay;
    Main.dragging = false;
    let dragX = 0;
    let dragY = 0;
    Main.mouseUpBlocked = false;
    Main.mouseMoveEvent = (clientX, clientY, buttons) => {
        // console.log(e.buttons, dragging);
        if (buttons !== 1) {
            if (Main.dragging) {
                let tX = rootGroup.dataTX ?? 0;
                let tY = rootGroup.dataTY ?? 0;
                rootGroup.dataTX = tX + clientX - dragX;
                rootGroup.dataTY = tY + clientY - dragY;
                dragX = clientX;
                dragY = clientY;
            }
            Main.dragging = false;
            return;
        }
        if (!Main.dragging) {
            Main.dragging = true;
            dragX = clientX;
            dragY = clientY;
            return;
        }
        if (Main.dragging) {
            let rect = Main.svg?.getBoundingClientRect();
            let tX = (rootGroup.dataTX ?? 0) + clientX - dragX;
            let tY = (rootGroup.dataTY ?? 0) + clientY - dragY;
            if (rect) {
                let gw = rootGroup?.getBoundingClientRect()?.width ?? 0;
                let gh = rootGroup?.getBoundingClientRect()?.height ?? 0;
                tX = Math.max((gw - 10) * -1, Math.min(tX, rect.width - 10));
                tY = Math.max((gh - 10) * -1, Math.min(tY, rect.height - 10));
            }
            if (rootGroup)
                rootGroup.style.transform = `translate(${tX}px,${tY}px)`;
        }
    };
    Main.mouseUpEvent = (clientX, clientY) => {
        if (Main.dragging) {
            let tX = rootGroup.dataTX ?? 0;
            let tY = rootGroup.dataTY ?? 0;
            rootGroup.dataTX = tX + clientX - dragX;
            rootGroup.dataTY = tY + clientY - dragY;
            dragX = clientX;
            dragY = clientY;
            Main.mouseUpBlocked = (Math.abs(clientX - dragX) + Math.abs(clientY - dragY) <= 5);
        }
        Main.dragging = false;
    };
    // iframe.contentWindow.postMessage({type: "click", x: x, y: y}, "*");
})(Main || (Main = {}));
const zoomEvCache = [];
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
function pointerUpHandler(ev) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3RzL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUF3QixDQUFDO0FBQ3hFLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDOUIsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNoQyxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBRWxDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDMUIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUMxQixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO0FBRXhCLHNDQUFzQztBQUN0Qyw0QkFBNEI7QUFDNUIsb0NBQW9DO0FBQ3BDLDhCQUE4QjtBQUM5Qix1Q0FBdUM7QUFDdkMsc0VBQXNFO0FBQ3RFLG1CQUFtQjtBQUNuQiw2Q0FBNkM7QUFDN0MsWUFBWTtBQUNaLFFBQVE7QUFDUixpQ0FBaUM7QUFDakMsb0RBQW9EO0FBQ3BELE9BQU87QUFDUCx1Q0FBdUM7QUFDdkMsNkJBQTZCO0FBQzdCLHFDQUFxQztBQUNyQyw4QkFBOEI7QUFDOUIsdUNBQXVDO0FBQ3ZDLHNFQUFzRTtBQUN0RSxtQkFBbUI7QUFDbkIsNkNBQTZDO0FBQzdDLFlBQVk7QUFDWixRQUFRO0FBQ1IsaUNBQWlDO0FBQ2pDLG9EQUFvRDtBQUNwRCxJQUFJO0FBQ0osd0NBQXdDO0FBQ3hDLDhCQUE4QjtBQUM5QixzQ0FBc0M7QUFDdEMsOEJBQThCO0FBQzlCLHVDQUF1QztBQUN2QyxzRUFBc0U7QUFDdEUsbUJBQW1CO0FBQ25CLDZDQUE2QztBQUM3QyxZQUFZO0FBQ1osUUFBUTtBQUNSLGlDQUFpQztBQUNqQyxvREFBb0Q7QUFDcEQsSUFBSTtBQUNKLElBQVUsSUFBSSxDQW9iYjtBQXBiRCxXQUFVLElBQUk7SUFFVixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUM7SUFDVixRQUFHLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsRCxJQUFJLFNBQVMsR0FBZ0IsUUFBUSxDQUFDLGVBQWUsQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN6RixTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMxQixjQUFTLEdBQWdCLFFBQVEsQ0FBQyxlQUFlLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDaEcsS0FBQSxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMxQixlQUFVLEdBQWdCLFFBQVEsQ0FBQyxlQUFlLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDakcsS0FBQSxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN2QyxTQUFTLENBQUMsV0FBVyxDQUFDLEtBQUEsU0FBUyxDQUFDLENBQUM7SUFDakMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxLQUFBLFVBQVUsQ0FBQyxDQUFDO0lBQ2xDLEtBQUEsR0FBRyxFQUFFLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM1QixRQUFRLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxFQUFFLFlBQVksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUM1RixhQUFRLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQztJQUVyQyxTQUFnQixhQUFhLENBQUMsRUFBVSxFQUFFLEdBQVc7UUFDakQsc0NBQXNDO1FBQ3RDLFlBQVk7UUFDWixPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELDRCQUE0QjtJQUNoQyxDQUFDO0lBTGUsa0JBQWEsZ0JBSzVCLENBQUE7SUFDRCxTQUFTLGdCQUFnQixDQUFDLEdBQVcsRUFBRSxTQUFvQjtRQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsRUFBRSxDQUFBLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksQ0FBQyxTQUFTLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUNELFNBQVMsT0FBTyxDQUFDLElBQVUsRUFBRSxRQUFjLEVBQUUsR0FBVztRQUNwRCxJQUFJLElBQUksR0FBVyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDdEIsS0FBSSxNQUFNLElBQUksSUFBSSxHQUFHLEVBQUMsQ0FBQztZQUNuQixJQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNmLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNMLENBQUM7UUFDRCxJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDeEIsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNmLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkIsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDbEMsT0FBTSxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsU0FBUyxFQUFDLENBQUM7WUFDN0MsSUFBSSxRQUFRLEdBQUcsS0FBQSxRQUFRLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEQsSUFBRyxDQUFDLFFBQVE7Z0JBQUUsTUFBTTtZQUNwQixJQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFHLENBQUM7Z0JBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbkQsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekIsUUFBUSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDN0IsQ0FBQztRQUNELElBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUMsQ0FBQztZQUNqQixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVc7Z0JBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztZQUNqRSxJQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhO2dCQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxXQUFXLENBQUM7WUFDekUsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNkLENBQUM7UUFDRCxLQUFJLE1BQU0sSUFBSSxJQUFJLFlBQVksRUFBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN0QixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFFaEIsQ0FBQztJQUNELFNBQVMsYUFBYSxDQUFDLElBQVMsRUFBQyxRQUFjLEVBQUMsR0FBYSxFQUFDLFdBQW1CLEVBQUU7UUFDL0UsSUFBSSxHQUFHLEdBQUcsS0FBQSxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxHQUFnQixDQUFDLENBQUM7UUFDdEQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUEsRUFBRSxDQUFBLENBQUMsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUMxQyxJQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBLEVBQUUsQ0FBQSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLENBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUM7WUFDdkQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUEsRUFBRSxDQUFBLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNwQyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDeEMsSUFBRyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUM7WUFBRSxPQUFPLElBQUksQ0FBQztRQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQSxFQUFFLENBQUEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQzNDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDN0UsSUFBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQSxFQUFFLENBQUEsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBQzFELGlCQUFpQjtRQUNqQixJQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQWdCLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDL0QsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztZQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsSUFBSSxDQUFDLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMvRCxLQUFBLFVBQVUsRUFBRSxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUMxQyxLQUFBLFVBQVUsRUFBRSxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdEMsS0FBQSxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLEtBQUksTUFBTSxJQUFJLElBQUksR0FBRyxFQUFDLENBQUM7WUFDbkIsSUFBRyxDQUFDLElBQUksQ0FBQyxLQUFLO2dCQUFFLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxHQUFDLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUNELEtBQUssVUFBVSxXQUFXO1FBQ3RCLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztRQUN0QixzQkFBc0I7UUFDdEIsSUFBSSxLQUFLLEdBQUcsS0FBQSxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFFLEVBQUUsQ0FBQSxJQUFJLEVBQUUsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRSxFQUFFLENBQUEsSUFBSSxFQUFFLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNqRCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFVLENBQUM7WUFDakMsSUFBRyxDQUFDLElBQUk7Z0JBQUUsTUFBTTtZQUVoQixZQUFZO1lBRVosSUFBSSxLQUFLLEdBQWlCLElBQUksQ0FBQztZQUMvQixJQUFHLElBQUksRUFBRSxHQUFDLEtBQUssQ0FBQyxZQUFZO2dCQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUUsRUFBRSxDQUFBLElBQUksRUFBRSxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QixLQUFJLElBQUksR0FBRyxJQUFJLElBQUksRUFBQyxDQUFDO2dCQUNqQixJQUFJLFFBQVEsR0FBRyxLQUFBLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxHQUFHLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBYyxDQUFDLENBQUM7Z0JBQ3ZFLElBQUcsQ0FBQyxRQUFRO29CQUFFLFNBQVM7Z0JBQ3ZCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBYyxDQUFDO2dCQUM1QyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2QixRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDckMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3BELEtBQUEsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUEsRUFBRSxDQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDN0QsSUFBRyxLQUFLLEVBQUUsQ0FBQztvQkFDUCxhQUFhLEVBQUUsQ0FBQztvQkFDaEIsTUFBTTtnQkFDVixDQUFDO1lBQ0wsQ0FBQztZQUNELEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQSxFQUFFLENBQUEsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksSUFBRyxDQUFDLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBQ0QsS0FBQSxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQSxFQUFFLENBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzdELE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQzVDLHFCQUFxQjtRQUNyQixLQUFLLEdBQUcsS0FBQSxRQUFRLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDakMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ25CLE9BQU0sS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNyQixJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFVLENBQUM7WUFDL0IsSUFBSSxHQUFHLEtBQUEsUUFBUSxDQUFDLElBQUksQ0FBRSxJQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsSUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9ELElBQUcsQ0FBQyxJQUFJO2dCQUFFLFNBQVM7WUFDbkIsSUFBSSxNQUFNLEdBQUcsS0FBQSxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNDLElBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFDLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsSUFBSSxJQUFJLENBQUMsV0FBVztvQkFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO2dCQUM1RCxJQUFJLElBQUksQ0FBQyxhQUFhO29CQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxXQUFXLENBQUM7Z0JBQ3BFLFNBQVM7WUFDYixDQUFDO1lBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyQixLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDL0IsSUFBRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3RCLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDekMsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBQ0QsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUMzQixLQUFLLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUUsRUFBRSxDQUFBLElBQUksRUFBRSxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUUsRUFBRSxDQUFBLElBQUksRUFBRSxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLE9BQU0sS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBVSxDQUFDO2dCQUMvQixJQUFJLFFBQVEsR0FBRyxLQUFBLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEQsSUFBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNYLEdBQUcsQ0FBQyxpREFBaUQsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDN0QsU0FBUztnQkFDYixDQUFDO2dCQUNELElBQUksR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFjLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3ZCLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLEtBQUssR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN2RCxLQUFBLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFBLEVBQUUsQ0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQzdELElBQUcsS0FBSyxFQUFFLENBQUM7b0JBQ1AsYUFBYSxFQUFFLENBQUM7b0JBQ2hCLE1BQU07Z0JBQ1YsQ0FBQztZQUNMLENBQUM7WUFDRCxlQUFlO1lBQ2YsdUJBQXVCO1lBQ3ZCLFdBQVc7WUFDWCwwRUFBMEU7WUFDMUUsc0NBQXNDO1lBQ3RDLDBCQUEwQjtZQUMxQix1RUFBdUU7WUFDdkUsNEVBQTRFO1lBQzVFLFVBQVU7WUFDVixJQUFJO1FBQ1IsQ0FBQztRQUVELDZDQUE2QztRQUM3QyxtQkFBbUI7UUFDbkIscUJBQXFCO1FBQ3JCLGtDQUFrQztRQUNsQyxpQkFBaUI7UUFDakIsa0RBQWtEO1FBQ2xELHFDQUFxQztRQUNyQyxxREFBcUQ7UUFDckQsbUJBQW1CO1FBQ25CLHVCQUF1QjtRQUN2QiwyQkFBMkI7UUFDM0IsZUFBZTtRQUNmLDBDQUEwQztRQUMxQyw4QkFBOEI7UUFDOUIsMkVBQTJFO1FBQzNFLGdGQUFnRjtRQUNoRixjQUFjO1FBQ2QsUUFBUTtRQUNSLDhDQUE4QztRQUM5QyxJQUFJO1FBQ0osT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUU3RCxDQUFDO0lBQ0QsS0FBSyxVQUFVLG1CQUFtQixDQUFDLE1BQXdDO1FBRXZFLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDNUIsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2YsSUFBSSxJQUFJLENBQUMsV0FBVztnQkFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO1lBQzVELElBQUksSUFBSSxDQUFDLGFBQWE7Z0JBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQztZQUNwRSxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDNUIsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQVUsQ0FBQztZQUNyQyxJQUFJLEtBQUssR0FBRyxNQUFNLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNULHFGQUFxRjtnQkFDckYsU0FBUztZQUNiLENBQUM7aUJBQ0ksQ0FBQztnQkFDRixPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsOEJBQThCLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDckQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDOUIsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQVUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxNQUFNLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNULHFGQUFxRjtnQkFDckYsU0FBUztZQUNiLENBQUM7aUJBQ0ksQ0FBQztnQkFDRixPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQztRQUNELG9DQUFvQztRQUNwQyxnQ0FBZ0M7UUFDaEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDekIsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNmLElBQUksSUFBSSxDQUFDLFdBQVc7Z0JBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztZQUM1RCxJQUFJLElBQUksQ0FBQyxhQUFhO2dCQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxXQUFXLENBQUM7UUFDeEUsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQztJQUloQixDQUFDO0lBRUQscUNBQXFDO0lBQzlCLEtBQUssVUFBVSxJQUFJO1FBRXRCLElBQUksQ0FBQyxLQUFBLFVBQVUsRUFBRSxDQUFDO1lBQ2QsS0FBQSxVQUFVLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6RSxLQUFBLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzNDLENBQUM7YUFBTSxDQUFDO1lBQ0osS0FBQSxVQUFVLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUM5QixDQUFDO1FBQ0QsU0FBUyxDQUFDLFdBQVcsQ0FBQyxLQUFBLFVBQVUsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sV0FBVyxFQUFFLENBQUM7UUFFcEIsU0FBUyxFQUFFLENBQUM7SUFFaEIsQ0FBQztJQWJxQixTQUFJLE9BYXpCLENBQUE7SUFDRCxLQUFLLFVBQVUsVUFBVSxDQUFDLElBQVUsRUFBRSxJQUFZO1FBQzlDLElBQUksS0FBSyxHQUFHLE1BQU0sS0FBQSxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3RFLElBQUksS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsWUFBWSxFQUFFLGdCQUFnQixDQUFDLEdBQUcsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQy9ELEtBQUEsVUFBVSxFQUFFLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzFDLEtBQUEsVUFBVSxFQUFFLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN0QyxLQUFBLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDRCxLQUFLLFVBQVUsa0JBQWtCO1FBQzdCLG1DQUFtQztRQUVuQyxxQ0FBcUM7UUFDckMsSUFBSSxJQUFJLEdBQUcsS0FBQSxRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUN6QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDUixPQUFPLENBQUMsS0FBSyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7WUFDekUsb0VBQW9FO1lBQ3BFLE9BQU8sU0FBUyxDQUFDO1FBQ3JCLENBQUM7UUFFRCxJQUFJLEtBQUssR0FBRyxNQUFNLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyxvREFBb0QsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxRSxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQ0QsTUFBTSxvQkFBb0IsRUFBRSxDQUFDO1FBQzdCLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDTSxLQUFLLFVBQVUsb0JBQW9CO1FBQ3RDLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztRQUNoQixJQUFJLElBQUksR0FBRyxLQUFBLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzNDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNSLE9BQU8sQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQztZQUM1QyxPQUFPO1FBQ1gsQ0FBQztRQUNELElBQUksS0FBSyxHQUFpQixJQUFJLENBQUM7UUFDL0IsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUNWLE9BQU8sRUFBRSxDQUFDO1lBQ1YsS0FBSyxHQUFHLE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1QsT0FBTyxDQUFDLElBQUksQ0FBQyxtREFBbUQsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDckYsQ0FBQztZQUNELElBQUksT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDO2dCQUNoQixPQUFPLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDbEUsT0FBTztZQUNYLENBQUM7WUFDRCxJQUFJLEdBQUcsS0FBQSxRQUFRLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUMzQyxDQUFDO0lBQ0wsQ0FBQztJQXBCcUIseUJBQW9CLHVCQW9CekMsQ0FBQTtJQUVELFNBQWdCLE9BQU87UUFDbkIsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUN6RCxPQUFPLEdBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQXNCLEVBQUUsYUFBYSxJQUFJLENBQUMsQ0FBQztRQUNyRixJQUFJLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNmLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBQ0QsS0FBSyxDQUFDLEtBQUssR0FBSSxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBc0IsRUFBRSxhQUFhLElBQUksQ0FBQyxDQUFDO1FBQ3pGLEtBQUssQ0FBQyxLQUFLLEdBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQXNCLEVBQUUsYUFBYSxJQUFJLEVBQUUsQ0FBQztRQUMxRixLQUFLLENBQUMsTUFBTSxHQUFJLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFzQixFQUFFLGFBQWEsSUFBSSxFQUFFLENBQUM7UUFDNUYsS0FBSyxDQUFDLFNBQVMsR0FBSSxRQUFRLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBc0IsRUFBRSxhQUFhLElBQUksRUFBRSxDQUFDO1FBQ2xHLEtBQUssQ0FBQyxNQUFNLEdBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQXNCLEVBQUUsYUFBYSxJQUFJLENBQUMsQ0FBQztRQUMzRixLQUFLLENBQUMsWUFBWSxHQUFJLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFzQixFQUFFLGFBQWEsSUFBSSxJQUFJLENBQUM7UUFDMUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3JELE9BQU8sR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFDOUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsU0FBUyxPQUFPLEVBQUUsQ0FBQztRQUcxQyx1Q0FBdUM7UUFDdkMsV0FBVztRQUNYLHFCQUFxQjtRQUVyQixnQ0FBZ0M7UUFDaEMsaUNBQWlDO1FBQ2pDLElBQUk7UUFDSixLQUFBLFNBQVMsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3hFLEtBQUEsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDckMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxLQUFBLFNBQVMsQ0FBQyxDQUFDO1FBQ2pDLEtBQUEsUUFBUSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7UUFDMUIsSUFBSSxFQUFFLENBQUM7SUFDWCxDQUFDO0lBN0JlLFlBQU8sVUE2QnRCLENBQUE7SUFDRCxTQUFnQixJQUFJO1FBQ2hCLElBQUksS0FBSyxHQUFHLEtBQUEsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxLQUFLO1lBQUUsT0FBTztRQUNuQixLQUFLLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztRQUNyQixLQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDckQsQ0FBQztJQUxlLFNBQUksT0FLbkIsQ0FBQTtJQUNELFNBQWdCLGFBQWE7UUFDekIsSUFBSSxLQUFLLEdBQUcsS0FBQSxRQUFRLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQixJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1IscURBQXFEO1lBQ3JELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzdCLENBQUM7YUFBTSxDQUFDO1lBQ0osS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDL0IsQ0FBQztJQUVMLENBQUM7SUFWZSxrQkFBYSxnQkFVNUIsQ0FBQTtJQUNELFNBQVMsU0FBUztRQUNkLElBQUksSUFBSSxHQUFHLEtBQUEsR0FBRyxFQUFFLHFCQUFxQixFQUFFLENBQUM7UUFDeEMsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPO1FBQ2xCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlELHdCQUF3QjtRQUN4QixxRUFBcUU7UUFDckUsa0RBQWtEO1FBQ2xELHFCQUFxQjtRQUVyQixTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxhQUFhLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQztRQUN4RCxTQUFpQixDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDOUIsU0FBaUIsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ25DLENBQUM7SUFDRCxTQUFnQixXQUFXLENBQUMsS0FBWTtRQUNwQyxLQUFBLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDbEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxHQUFHLEtBQUEsUUFBUSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFUZSxnQkFBVyxjQVMxQixDQUFBO0lBQ1UsYUFBUSxHQUFHLEtBQUssQ0FBQztJQUM1QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDZCxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDSCxtQkFBYyxHQUFHLEtBQUssQ0FBQztJQUVyQixtQkFBYyxHQUFHLENBQUMsT0FBZSxFQUFFLE9BQWUsRUFBRSxPQUFlLEVBQUUsRUFBRTtRQUNoRixvQ0FBb0M7UUFDcEMsSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDaEIsSUFBSSxLQUFBLFFBQVEsRUFBRSxDQUFDO2dCQUNYLElBQUksRUFBRSxHQUFJLFNBQWlCLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxFQUFFLEdBQUksU0FBaUIsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO2dCQUN2QyxTQUFpQixDQUFDLE1BQU0sR0FBRyxFQUFFLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFDaEQsU0FBaUIsQ0FBQyxNQUFNLEdBQUcsRUFBRSxHQUFHLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ2pELEtBQUssR0FBRyxPQUFPLENBQUM7Z0JBQ2hCLEtBQUssR0FBRyxPQUFPLENBQUM7WUFDcEIsQ0FBQztZQUNELEtBQUEsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUNqQixPQUFPO1FBQ1gsQ0FBQztRQUNELElBQUksQ0FBQyxLQUFBLFFBQVEsRUFBRSxDQUFDO1lBQ1osS0FBQSxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ2hCLEtBQUssR0FBRyxPQUFPLENBQUM7WUFDaEIsS0FBSyxHQUFHLE9BQU8sQ0FBQztZQUNoQixPQUFPO1FBQ1gsQ0FBQztRQUNELElBQUksS0FBQSxRQUFRLEVBQUUsQ0FBQztZQUNYLElBQUksSUFBSSxHQUFHLEtBQUEsR0FBRyxFQUFFLHFCQUFxQixFQUFFLENBQUM7WUFDeEMsSUFBSSxFQUFFLEdBQUcsQ0FBRSxTQUFpQixDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQzVELElBQUksRUFBRSxHQUFHLENBQUUsU0FBaUIsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUM1RCxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNQLElBQUksRUFBRSxHQUFHLFNBQVMsRUFBRSxxQkFBcUIsRUFBRSxFQUFFLEtBQUssSUFBSSxDQUFDLENBQUM7Z0JBQ3hELElBQUksRUFBRSxHQUFHLFNBQVMsRUFBRSxxQkFBcUIsRUFBRSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUM7Z0JBQ3pELEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0QsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLENBQUM7WUFDRCxJQUFJLFNBQVM7Z0JBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsYUFBYSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUM7UUFDNUUsQ0FBQztJQUNMLENBQUMsQ0FBQTtJQUNZLGlCQUFZLEdBQUcsQ0FBQyxPQUFlLEVBQUUsT0FBZSxFQUFFLEVBQUU7UUFDN0QsSUFBSSxLQUFBLFFBQVEsRUFBRSxDQUFDO1lBRVgsSUFBSSxFQUFFLEdBQUksU0FBaUIsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO1lBQ3hDLElBQUksRUFBRSxHQUFJLFNBQWlCLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztZQUN2QyxTQUFpQixDQUFDLE1BQU0sR0FBRyxFQUFFLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNoRCxTQUFpQixDQUFDLE1BQU0sR0FBRyxFQUFFLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNqRCxLQUFLLEdBQUcsT0FBTyxDQUFDO1lBQ2hCLEtBQUssR0FBRyxPQUFPLENBQUM7WUFDaEIsS0FBQSxjQUFjLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBQ0QsS0FBQSxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLENBQUMsQ0FBQTtJQUNELHNFQUFzRTtBQUMxRSxDQUFDLEVBcGJTLElBQUksS0FBSixJQUFJLFFBb2JiO0FBQ0QsTUFBTSxXQUFXLEdBQW1CLEVBQUUsQ0FBQztBQUN2QyxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNsQixJQUFJLENBQUMsR0FBRyxFQUFFLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO0lBQzdDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDekIsQ0FBQyxFQUFFO0FBQ0MsaUJBQWlCO0NBQ3BCLENBQUMsQ0FBQztBQUNILElBQUksQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUU7SUFDN0Msd0VBQXdFO0lBQ3hFLG9CQUFvQjtJQUNwQiwrQkFBK0I7SUFDL0IsSUFBSTtJQUNKLGdDQUFnQztJQUNoQyw2RkFBNkY7SUFDN0Ysa0NBQWtDO0lBQ2xDLDJEQUEyRDtJQUMzRCwyREFBMkQ7SUFDM0QsU0FBUztJQUNULDBCQUEwQjtJQUMxQixvQ0FBb0M7SUFDcEMsNERBQTREO0lBQzVELFlBQVk7SUFDWixvQ0FBb0M7SUFDcEMsaUVBQWlFO0lBQ2pFLFlBQVk7SUFDWiw4QkFBOEI7SUFDOUIsUUFBUTtJQUNSLFdBQVc7SUFDWCxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEQsSUFBSTtJQUNKLHVCQUF1QjtJQUN2Qix3QkFBd0I7QUFDNUIsQ0FBQyxFQUFFO0lBQ0MsT0FBTyxFQUFFLElBQUk7Q0FDaEIsQ0FBQyxDQUFDO0FBQ0gseUVBQXlFO0FBQ3pFLFNBQVMsZ0JBQWdCLENBQUMsRUFBZ0I7SUFDdEMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDaEIsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3BCLEVBQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFDRCx1Q0FBdUM7SUFDdkMseURBQXlEO0lBQ3pELEtBQUs7SUFDTCxnQ0FBZ0M7SUFDaEMsZ0NBQWdDO0lBQ2hDLHFCQUFxQjtJQUNyQixJQUFJO0FBQ1IsQ0FBQztBQUNELElBQUksQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLGdCQUFnQixFQUFFO0lBQ3RELE9BQU8sRUFBRSxJQUFJO0NBQ2hCLENBQUMsQ0FBQztBQUNILElBQUksQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLGdCQUFnQixFQUFFO0lBQzFELE9BQU8sRUFBRSxJQUFJO0NBQ2hCLENBQUMsQ0FBQztBQUNILElBQUksQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLGdCQUFnQixFQUFFO0lBQ3ZELE9BQU8sRUFBRSxJQUFJO0NBQ2hCLENBQUMsQ0FBQztBQUNILElBQUksQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsY0FBYyxFQUFFLGdCQUFnQixFQUFFO0lBQ3pELE9BQU8sRUFBRSxJQUFJO0NBQ2hCLENBQUMsQ0FBQztBQUNILGtEQUFrRDtBQUNsRCwwQkFBMEI7QUFDMUIsK0JBQStCO0FBQy9CLHdCQUF3QjtBQUN4QixnRUFBZ0U7QUFDaEUsNENBQTRDO0FBQzVDLDRDQUE0QztBQUM1QyxpQ0FBaUM7QUFDakMsc0JBQXNCO0FBQ3RCLDZFQUE2RTtBQUM3RSw2RkFBNkY7QUFDN0Ysd0RBQXdEO0FBQ3hELDZDQUE2QztBQUM3Qyw2Q0FBNkM7QUFDN0Msa0NBQWtDO0FBQ2xDLHVCQUF1QjtBQUN2QixxQkFBcUI7QUFDckIsNEJBQTRCO0FBQzVCLDZEQUE2RDtBQUM3RCxxQkFBcUI7QUFDckIsMEJBQTBCO0FBQzFCLHdEQUF3RDtBQUN4RCxxQkFBcUI7QUFDckIsNEJBQTRCO0FBQzVCLGlFQUFpRTtBQUNqRSx5Q0FBeUM7QUFDekMseUNBQXlDO0FBQ3pDLG1CQUFtQjtBQUNuQixxQkFBcUI7QUFDckIsUUFBUTtBQUNSLE1BQU07QUFDTixNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtJQUNqQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMifQ==