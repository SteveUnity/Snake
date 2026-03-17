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
    async function GenerateMap() {
        // place the starting arrow
        // console.log("placeStartingArrow start");
        // let arrow = await placeStartingArrow();
        let cell = Main.gridPath.getEmptyCellWithRank();
        let counter = 0;
        debugger;
        while (cell && counter < 100) {
            counter++;
            let region = Main.gridPath.getEmptyRegion(cell);
            console.log("region", region);
            let arrow = await PlaceArrowForRegion(region);
            if (arrow) {
                counter = 0;
            }
            cell = Main.gridPath.getEmptyCellWithRank();
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
                console.warn("No arrow found! Failed to generate arrow for region", cell, region);
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
                console.warn("No arrow found! Failed to generate arrow for region", cell, region);
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
    draw();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3RzL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUF3QixDQUFDO0FBQ3hFLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDOUIsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNoQyxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBRWxDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDMUIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUMxQixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO0FBRXhCLHNDQUFzQztBQUN0Qyw0QkFBNEI7QUFDNUIsb0NBQW9DO0FBQ3BDLDhCQUE4QjtBQUM5Qix1Q0FBdUM7QUFDdkMsc0VBQXNFO0FBQ3RFLG1CQUFtQjtBQUNuQiw2Q0FBNkM7QUFDN0MsWUFBWTtBQUNaLFFBQVE7QUFDUixpQ0FBaUM7QUFDakMsb0RBQW9EO0FBQ3BELE9BQU87QUFDUCx1Q0FBdUM7QUFDdkMsNkJBQTZCO0FBQzdCLHFDQUFxQztBQUNyQyw4QkFBOEI7QUFDOUIsdUNBQXVDO0FBQ3ZDLHNFQUFzRTtBQUN0RSxtQkFBbUI7QUFDbkIsNkNBQTZDO0FBQzdDLFlBQVk7QUFDWixRQUFRO0FBQ1IsaUNBQWlDO0FBQ2pDLG9EQUFvRDtBQUNwRCxJQUFJO0FBQ0osd0NBQXdDO0FBQ3hDLDhCQUE4QjtBQUM5QixzQ0FBc0M7QUFDdEMsOEJBQThCO0FBQzlCLHVDQUF1QztBQUN2QyxzRUFBc0U7QUFDdEUsbUJBQW1CO0FBQ25CLDZDQUE2QztBQUM3QyxZQUFZO0FBQ1osUUFBUTtBQUNSLGlDQUFpQztBQUNqQyxvREFBb0Q7QUFDcEQsSUFBSTtBQUNKLElBQVUsSUFBSSxDQTBS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