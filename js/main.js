"use strict";
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
const rng = seededRandomGenerator(rngSeed);
function Rand() {
    return seededRandomGenerator(rngSeed++)();
}
// if(false){
//     let innerWidth =  (window.innerWidth - 100)/scale -5;
//     let innerHeight = (window.innerHeight - 100)/scale -5;
//         width = innerWidth;
//         height = innerHeight;
//     console.log({width, height,innerWidth:window.innerWidth,innerHeight:window.innerHeight});
// }
const svg = document.getElementById("svg");
let rootGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
rootGroup.classList.add("rootGroup");
let gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
gridGroup.classList.add("gridGroup");
let arrowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
arrowGroup.classList.add("arrowGroup");
rootGroup.appendChild(gridGroup);
rootGroup.appendChild(arrowGroup);
svg?.appendChild(rootGroup);
document.getElementById("arrow-head")?.setAttribute("markerHeight", Math.max(6, props.scale / 6) + '');
let gridPath = new GridPath();
// let arrows: SVGPathElement[] = [];
function draw() {
    if (!arrowGroup) {
        arrowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        arrowGroup.classList.add("arrowGroup");
    }
    else {
        arrowGroup.innerHTML = "";
    }
    rootGroup.appendChild(arrowGroup);
    // place the starting arrow
    let arrow = drawStartingArrow();
    let counter = 0;
    while (arrow !== undefined && counter < 100) {
        arrow = drawStartingArrow();
        counter++;
    }
    if (counter >= 100) {
        console.error("Failed to generate starting arrow! Max attempts reached!");
        alert("Failed to generate starting arrow! Max attempts reached!");
    }
    // for(let i = props.maxRank; i >=props.maxRank-3 ; i--){
    // // for(let i = 0; i < props.maxRank; i++){
    //     let cells = gridPath.getPeremeterCells(i);
    //     console.log(`get Peremeter Cells ${i}`,cells.length, cells);
    //     cells = cells.sort((a,b)=>Rand() - 0.5);
    //     cells = cells.filter(cell=>cell.Arrow == null);
    //     for(let cell of cells){
    //         if(cell.Arrow != null) continue;
    //         let arrow = gridPath.GenerateArrow(cell, props.maxLength, props.maxRank-i);
    //         if(arrow == null) continue;
    //         let [arrowElement,collisionElement] = arrow.GetArrowElement();
    //         // arrows.push(arrowElement);
    //         // arrows.push(collisionElement);
    //         arrowGroup?.appendChild(collisionElement);
    //         arrowGroup?.appendChild(arrowElement);
    //         gridPath.AddArrow(arrow);
    //     }
    // }
    centersvg();
}
function drawStartingArrow() {
    console.log("drawStartingArrow");
    let cell = gridPath.GetRandomEmptyCell();
    if (!cell) {
        console.error("No empty cell found! Failed to generate starting arrow!");
        // alert("No empty cell found! Failed to generate starting arrow!");
        return undefined;
    }
    let arrow = gridPath.GenerateArrow(cell, props.maxLength, 1);
    if (!arrow) {
        console.error("No arrow found! Failed to generate starting arrow!", cell);
        cell.Rank = -1;
        // alert("No arrow found! Failed to generate starting arrow!");
        return null;
    }
    let [arrowElement, collisionElement] = arrow.GetArrowElement();
    arrowGroup?.appendChild(collisionElement);
    arrowGroup?.appendChild(arrowElement);
    gridPath.AddArrow(arrow);
    // gridPath.getArrowHeadRay(arrow).forEach(cell=>{
    //     cell.fillColor("green");
    // });
    drawFollowingArrows(2);
    return arrow;
}
function drawFollowingArrows(rank) {
    let counter = 0;
    let cell = gridPath.getEmptyCellByRank(rank);
    if (!cell) {
        console.warn("No empty cell for next rank", rank);
        return false;
    }
    while (cell) {
        let arrow = gridPath.GenerateArrow(cell, props.maxLength, rank);
        if (!arrow) {
            console.warn("No arrow found! Failed to generate arrow for rank", rank, cell);
            cell.Rank = -1;
            cell = gridPath.getEmptyCellByRank(rank);
            continue;
        }
        counter++;
        let [arrowElement, collisionElement] = arrow.GetArrowElement();
        arrowGroup?.appendChild(collisionElement);
        arrowGroup?.appendChild(arrowElement);
        gridPath.AddArrow(arrow);
        // gridPath.getArrowHeadRay(arrow).forEach(cell=>{
        cell = gridPath.getEmptyCellByRank(rank);
        if (counter > 100) {
            console.error("Failed to generate arrow for rank", rank, cell);
            alert("Failed to generate arrow for rank " + rank + " | Looping for too long");
            return false;
        }
    }
    console.log("drawFollowingArrows", counter);
    drawFollowingArrows(rank + 1);
    return true;
}
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
    gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gridGroup.classList.add("gridGroup");
    rootGroup.appendChild(gridGroup);
    gridPath = new GridPath();
    draw();
}
function hint() {
    let arrow = gridPath.Hint();
    if (!arrow)
        return;
    arrow.Color = "pink";
    arrow.GetArrowElement()[1].style.stroke = "pink";
}
function validateLevel() {
    let valid = gridPath.ValidateLevel();
    console.log(valid);
    if (valid) {
        document.getElementById("RestartButton")?.click();
    }
    else {
        alert("Level is invalid!");
    }
}
function centersvg() {
    let rect = svg?.getBoundingClientRect();
    if (!rect)
        return;
    const tX = rect.width / 2 - (props.width * props.scale) / 2;
    const tY = rect.height / 2 - (props.height * props.scale) / 2;
    console.log({ tX, tY });
    console.log(props.width * props.scale, props.height * props.scale);
    console.log(rootGroup.getBoundingClientRect());
    console.log(rect);
    rootGroup.style.transform = `translate(${tX}px,${tY}px)`;
    rootGroup.dataTX = tX;
    rootGroup.dataTY = tY;
}
function validateRay(arrow) {
    gridPath.GetAllCells().forEach(cell => {
        cell.fillColor("none");
    });
    let ray = gridPath.getArrowHeadRay(arrow);
    ray.forEach(cell => {
        cell.fillColor("green");
    });
}
let dragging = false;
let dragX = 0;
let dragY = 0;
const mouseMoveEvent = (clientX, clientY, buttons) => {
    // console.log(e.buttons, dragging);
    if (buttons !== 1) {
        if (dragging) {
            let tX = rootGroup.dataTX ?? 0;
            let tY = rootGroup.dataTY ?? 0;
            rootGroup.dataTX = tX + clientX - dragX;
            rootGroup.dataTY = tY + clientY - dragY;
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
const mouseUpEvent = (clientX, clientY) => {
    if (dragging) {
        let tX = rootGroup.dataTX ?? 0;
        let tY = rootGroup.dataTY ?? 0;
        rootGroup.dataTX = tX + clientX - dragX;
        rootGroup.dataTY = tY + clientY - dragY;
        dragX = clientX;
        dragY = clientY;
        mouseUpBlocked = (Math.abs(clientX - dragX) + Math.abs(clientY - dragY) <= 5);
    }
    dragging = false;
};
svg?.addEventListener("pointermove", (ev) => {
    mouseMoveEvent(ev.clientX, ev.clientY, ev.buttons);
}, {
    capture: true,
    passive: true
});
let mouseUpBlocked = false;
svg?.addEventListener("pointerup", (ev) => {
    if (dragging) {
        ev.preventDefault();
        ev.stopPropagation();
        mouseUpEvent(ev.clientX, ev.clientY);
    }
});
// iframe.contentWindow.postMessage({type: "click", x: x, y: y}, "*");
window.addEventListener("message", (event) => {
    console.log(event);
    switch (event.data.type) {
        case "click":
            // window.dispatchEvent(new MouseEvent("click", {
            //     clientX: event.data.x,
            //     clientY: event.data.y,
            //     buttons: 1,
            // }));
            window.document.elementsFromPoint(event.data.x, event.data.y)
                .find(element => element.classList.contains("collisionElement"))
                ?.dispatchEvent(new MouseEvent("click", {
                clientX: event.data.x,
                clientY: event.data.y,
                buttons: 1,
            }));
            break;
        case "mousemove":
            mouseMoveEvent(event.data.x, event.data.y, 1);
            break;
        case "mouseup":
            mouseUpEvent(event.data.x, event.data.y);
            break;
        case "mousedown":
            window.dispatchEvent(new MouseEvent("mousedown", {
                clientX: event.data.x,
                clientY: event.data.y,
            }));
            break;
    }
});
