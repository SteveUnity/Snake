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
        let dirs = [0, 1, 2, 3]; //.sort(()=>Rand()*2-1);
        for (let i = 0; i < count && cells.length > 0; i++) {
            const cell = cells.pop();
            if (!cell)
                break;
            // debugger;
            let arrow = null;
            // if(Rand()>props.straightness)
            //     dirs.sort(()=>Rand()*2-1);
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
        let nextarrow = null;
        // if arrow immediately ahead is length less than 3, merge them
        for (const cell of ray) {
            if (!cell.Arrow) {
                // next cell is empty, extend arrow to it
                //! is this going to create deadlocks?
                arrow.PrependPoint(cell.Id);
                cell.Arrow = arrow;
                continue;
            }
            if (cell.Arrow) {
                if (cell.Arrow.Direction == arrow.Direction && ray.includes(Main.gridPath.GetCell(cell.Arrow.TailCell))) {
                    // ahead arrow is 2 cell arrow, merge them
                    nextarrow = cell;
                }
                break;
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3RzL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUF3QixDQUFDO0FBQ3hFLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDOUIsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNoQyxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBRWxDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDMUIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUMxQixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO0FBRXhCLHNDQUFzQztBQUN0Qyw0QkFBNEI7QUFDNUIsb0NBQW9DO0FBQ3BDLDhCQUE4QjtBQUM5Qix1Q0FBdUM7QUFDdkMsc0VBQXNFO0FBQ3RFLG1CQUFtQjtBQUNuQiw2Q0FBNkM7QUFDN0MsWUFBWTtBQUNaLFFBQVE7QUFDUixpQ0FBaUM7QUFDakMsb0RBQW9EO0FBQ3BELE9BQU87QUFDUCx1Q0FBdUM7QUFDdkMsNkJBQTZCO0FBQzdCLHFDQUFxQztBQUNyQyw4QkFBOEI7QUFDOUIsdUNBQXVDO0FBQ3ZDLHNFQUFzRTtBQUN0RSxtQkFBbUI7QUFDbkIsNkNBQTZDO0FBQzdDLFlBQVk7QUFDWixRQUFRO0FBQ1IsaUNBQWlDO0FBQ2pDLG9EQUFvRDtBQUNwRCxJQUFJO0FBQ0osd0NBQXdDO0FBQ3hDLDhCQUE4QjtBQUM5QixzQ0FBc0M7QUFDdEMsOEJBQThCO0FBQzlCLHVDQUF1QztBQUN2QyxzRUFBc0U7QUFDdEUsbUJBQW1CO0FBQ25CLDZDQUE2QztBQUM3QyxZQUFZO0FBQ1osUUFBUTtBQUNSLGlDQUFpQztBQUNqQyxvREFBb0Q7QUFDcEQsSUFBSTtBQUNKLElBQVUsSUFBSSxDQTBo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