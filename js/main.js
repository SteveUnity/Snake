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
    Main.rootGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    Main.rootGroup.classList.add("rootGroup");
    Main.gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    Main.gridGroup.classList.add("gridGroup");
    Main.arrowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    Main.arrowGroup.classList.add("arrowGroup");
    Main.rootGroup.appendChild(Main.gridGroup);
    Main.rootGroup.appendChild(Main.arrowGroup);
    Main.svg?.appendChild(Main.rootGroup);
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
        // log("arrow body",body);
        // log("arrow empty",arrow.Path);
        const firstCell = body.shift();
        firstCell.Rank = maxRank;
        firstCell.Arrow = arrow;
        for (const cell of body) {
            cell.Rank = maxRank;
            cell.Arrow = arrow;
            arrow.AddPoint([...cell.Id]);
        }
        // log("arrow full",arrow.Path);
        Main.gridPath.AddArrow(arrow);
        for (const cell of ray) {
            if (!cell.Arrow)
                cell.Rank = maxRank + 1;
        }
        return arrow;
    }
    function GenerateArrowsFromCells(cells) {
        const arrows = [];
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
                    arrows.push(arrow);
                    log("arrow generated", arrow);
                    break;
                }
            }
            cells = cells.filter(cell => cell.Arrow == null && cell.Rank >= 0);
        }
        Main.gridPath.GetAllCells().forEach(cell => cell.fillColor("none"));
        return arrows;
    }
    async function GenerateMap() {
        let arrowsCreated = 0;
        // get all empty cells
        let cells = Main.gridPath.GetAllCells();
        cells.sort(() => Rand() * 2 - 1);
        const arrows = GenerateArrowsFromCells(cells);
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
    function mergeArrowAhead(arrow) {
        let ray = Main.gridPath.getArrowHeadRay(arrow);
        // if arrow immediately ahead is length less than 3, merge them
        let nextarrow = ray.find(cell => cell.Arrow && cell.Arrow.Length < 3 && cell.Arrow.Direction == arrow.Direction);
        for (let i = 0; i < ray.length; i++) {
            if (ray[i].Arrow)
                break;
            arrow.PrependPoint(ray[i].Id);
            ray[i].Arrow = arrow;
        }
        if (arrow.Length < 3) {
            arrow.Color = "red";
        }
        if (nextarrow) {
            return { cell1: Main.gridPath.Grid[arrow.HeadCell[0]][arrow.HeadCell[1]], cell2: Main.gridPath.Grid[nextarrow.Arrow.HeadCell[0]][nextarrow.Arrow.HeadCell[1]] };
        }
        return null;
    }
    function mergeArrowBehind(arrow) {
        let mergePot = [];
        let tail = arrow.TailCell;
        for (let d = -2; d < 2; d++) {
            let i = 1;
            let dir = [((d + 1) % 2) + tail[0], d % 2 + tail[1]];
            const nextCell = Main.gridPath.Grid[dir[0] * i][dir[1] * i];
            while (nextCell && i < 10) {
                // if(nextCell.Arrow
            }
        }
    }
    function extendToEmptyCellAtTail() { }
    async function GenerateMapSpiral() {
        let centralCell = Main.gridPath.Grid[Math.floor(props.width / 2)][Math.floor(props.height / 2)];
        if (!centralCell)
            return;
        let allCells = Main.gridPath.getCellsByPositionRank(centralCell);
        let arrows = [];
        for (let rank in Object.keys(allCells)) {
            const cells = allCells[rank];
            // log("rank", rank, cells);
            let arrs = GenerateArrowsFromCells(cells);
            arrows.push(...arrs);
        }
        let maxLength = arrows.reduce((max, arrow) => Math.max(max, arrow.Length), 0);
        console.log("maxLength", maxLength);
        let mergeArrows = [];
        arrows.forEach(arrow => {
            // if arrow immediately ahead is length less than 3, merge them
            const nextarrow = mergeArrowAhead(arrow);
            if (nextarrow) {
                mergeArrows.push(nextarrow);
            }
        });
        mergeArrows.forEach(merge => {
            let firstArrow = merge.cell1.Arrow;
            let secondArrow = merge.cell2.Arrow;
            if (firstArrow === secondArrow)
                return;
            firstArrow.Path.forEach(point => {
                secondArrow.AddPoint(point);
                Main.gridPath.Grid[point[0]][point[1]].Arrow = secondArrow;
            });
            Main.gridPath.DeleteArrow(firstArrow);
        });
        Main.gridPath.Arrows.forEach(arrow => {
            let [arrowElement, collisionElement] = arrow.GetArrowElement();
            Main.arrowGroup?.appendChild(collisionElement);
            Main.arrowGroup?.appendChild(arrowElement);
        });
        for (let cell of Main.gridPath.GetAllCells()) {
            let parent = cell.squareElement?.parentElement;
            if (!parent)
                continue;
            parent.innerHTML = '';
            if (!cell.Arrow)
                continue;
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", props.scale / 2 + '');
            dot.setAttribute("cy", props.scale / 2 + '');
            dot.setAttribute("r", "3");
            dot.setAttribute("fill", "white");
            parent.appendChild(dot);
            dot.addEventListener("click", () => {
                console.log("click", cell.Arrow?.Path.map(c => Main.gridPath.GetCell(c)?.element));
            });
        }
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
        Main.rootGroup.appendChild(Main.arrowGroup);
        // await GenerateMap();
        await GenerateMapSpiral();
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
        [...Main.rootGroup.children].forEach(child => child.remove());
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
        Main.rootGroup.appendChild(Main.gridGroup);
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
        Main.rootGroup.style.transform = `translate(${tX}px,${tY}px)`;
        Main.rootGroup.dataTX = tX;
        Main.rootGroup.dataTY = tY;
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
                let tX = Main.rootGroup.dataTX ?? 0;
                let tY = Main.rootGroup.dataTY ?? 0;
                Main.rootGroup.dataTX = tX + clientX - dragX;
                Main.rootGroup.dataTY = tY + clientY - dragY;
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
            let tX = (Main.rootGroup.dataTX ?? 0) + clientX - dragX;
            let tY = (Main.rootGroup.dataTY ?? 0) + clientY - dragY;
            if (rect) {
                let gw = Main.rootGroup?.getBoundingClientRect()?.width ?? 0;
                let gh = Main.rootGroup?.getBoundingClientRect()?.height ?? 0;
                tX = Math.max((gw - 10) * -1, Math.min(tX, rect.width - 10));
                tY = Math.max((gh - 10) * -1, Math.min(tY, rect.height - 10));
            }
            if (Main.rootGroup)
                Main.rootGroup.style.transform = `translate(${tX}px,${tY}px)`;
        }
    };
    Main.mouseUpEvent = (clientX, clientY) => {
        console.log("mouseUpEvent", clientX, clientY);
        if (Main.dragging) {
            let tX = Main.rootGroup.dataTX ?? 0;
            let tY = Main.rootGroup.dataTY ?? 0;
            Main.rootGroup.dataTX = tX + clientX - dragX;
            Main.rootGroup.dataTY = tY + clientY - dragY;
            Main.mouseUpBlocked = (Math.abs(clientX - dragX) + Math.abs(clientY - dragY) > 5);
            dragX = clientX;
            dragY = clientY;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3RzL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUF3QixDQUFDO0FBQ3hFLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDOUIsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNoQyxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBRWxDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDMUIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUMxQixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO0FBRXhCLHNDQUFzQztBQUN0Qyw0QkFBNEI7QUFDNUIsb0NBQW9DO0FBQ3BDLDhCQUE4QjtBQUM5Qix1Q0FBdUM7QUFDdkMsc0VBQXNFO0FBQ3RFLG1CQUFtQjtBQUNuQiw2Q0FBNkM7QUFDN0MsWUFBWTtBQUNaLFFBQVE7QUFDUixpQ0FBaUM7QUFDakMsb0RBQW9EO0FBQ3BELE9BQU87QUFDUCx1Q0FBdUM7QUFDdkMsNkJBQTZCO0FBQzdCLHFDQUFxQztBQUNyQyw4QkFBOEI7QUFDOUIsdUNBQXVDO0FBQ3ZDLHNFQUFzRTtBQUN0RSxtQkFBbUI7QUFDbkIsNkNBQTZDO0FBQzdDLFlBQVk7QUFDWixRQUFRO0FBQ1IsaUNBQWlDO0FBQ2pDLG9EQUFvRDtBQUNwRCxJQUFJO0FBQ0osd0NBQXdDO0FBQ3hDLDhCQUE4QjtBQUM5QixzQ0FBc0M7QUFDdEMsOEJBQThCO0FBQzlCLHVDQUF1QztBQUN2QyxzRUFBc0U7QUFDdEUsbUJBQW1CO0FBQ25CLDZDQUE2QztBQUM3QyxZQUFZO0FBQ1osUUFBUTtBQUNSLGlDQUFpQztBQUNqQyxvREFBb0Q7QUFDcEQsSUFBSTtBQUNKLElBQVUsSUFBSSxDQW9o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