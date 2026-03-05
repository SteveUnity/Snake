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
let gridPath = new GridPath();
document.getElementById("arrow-head")?.setAttribute("markerHeight", props.scale / 6 + '');
let maxX = 0;
let maxY = 0;
// function drawArrow(points: any) {
//     let path = StringifyBreakPointsToPath(points, 40);
//     const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path")
//     arrow.setAttribute("d", path);
//     let rot = Math.floor(Rand() * 360);
//     arrow.style.filter = `hue-rotate(${rot}deg)`;
//     return arrow;
// }
let gridGroup = null;
let rootGroup = null;
function drawGrid(x, y) {
    if (gridGroup)
        gridGroup.remove();
    gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    document.getElementById("svg")?.appendChild(gridGroup);
    for (let i = 1; i <= x + 2; i++) {
        for (let j = 1; j <= y + 2; j++) {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", (i * props.scale).toString());
            rect.setAttribute("y", (j * props.scale).toString());
            gridGroup.appendChild(rect);
        }
    }
}
const svg = document.getElementById("svg");
let count = 0;
drawGrid(props.width, props.height);
// if(svg){
//     // inner width
//     svg.style.width = `${props.width * props.scale + 100}px`;
//     svg.style.height = `${props.height * props.scale + 100}px`;
// }
let arrows = [];
async function clear() {
    return new Promise(resolve => {
        let interval = setInterval(() => {
            arrows.pop()?.remove();
            if (arrows.length == 0) {
                clearInterval(interval);
                resolve(void 0);
                return;
            }
        }, 1);
    });
}
function draw() {
    rootGroup?.remove();
    rootGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg?.appendChild(rootGroup);
    // console.log("Grid",JSON.parse(JSON.stringify(gridPath.Grid)));
    // console.log("draw");
    for (let i = props.maxRank; i >= 0; i--) {
        // for(let i = 0; i < props.maxRank; i++){
        let cells = gridPath.getPeremeterCellsCercular(i);
        console.log(`get Peremeter Cells ${i}`, cells.length, cells);
        cells = cells.sort((a, b) => Rand() - 0.5);
        // console.log(`get Peremeter Cells ${i}`,JSON.parse(JSON.stringify(cells)));
        cells = cells.filter(cell => cell.Arrow == null);
        // console.log(`get Empty Peremeter Cells ${i}`,JSON.parse(JSON.stringify(cells)));
        for (let cell of cells) {
            if (cell.Arrow != null)
                continue;
            let arrow = gridPath.GenerateArrow(cell, props.maxLength, i);
            if (arrow == null)
                continue;
            let [arrowElement, collisionElement] = arrow.GetArrowElement();
            arrows.push(arrowElement);
            arrows.push(collisionElement);
            rootGroup?.appendChild(collisionElement);
            rootGroup?.appendChild(arrowElement);
            gridPath.AddArrow(arrow);
        }
    }
    // for(let i = 0; i < props.maxRank; i++){
    //     let cells = gridPath.getPeremeterCells(i);
    //     cells = cells.sort((a,b)=>Rand() - 0.5);
    //     // console.log(`get Peremeter Cells ${i}`,JSON.parse(JSON.stringify(cells)));
    //     cells = cells.filter(cell=>cell.Arrow == null);
    //     // console.log(`get Empty Peremeter Cells ${i}`,JSON.parse(JSON.stringify(cells)));
    //     for(let cell of cells){
    //         if(cell.Arrow != null) continue;
    //         let arrow = gridPath.GenerateArrow(cell, props.maxLength, i);
    //         if(arrow == null) continue;
    //         let [arrowElement,collisionElement] = arrow.GetArrowElement();
    //         arrows.push(arrowElement);
    //         arrows.push(collisionElement);
    //         rootGroup?.appendChild(collisionElement);
    //         rootGroup?.appendChild(arrowElement);
    //         gridPath.AddArrow(arrow);
    //     }
    // }
    // count++;
    // if (count > 10) {
    //     return;
    // }
    // let i = 0;
    // while(i < width * height / 2) {
    //     i++;
    //     let start = gridPath.getRandomEmptyCellEdge();
    //     if(start == null) continue;
    //     let path = gridPath.GenerateArrow(start, 10);
    //     // console.log(path);
    //     if (path == null) continue;
    //     let arrow = path.GetArrowElement();
    //     arrows.push(arrow);
    //     // console.log(arrow);
    //     svg?.appendChild(arrow);
    // }
    // i=0;
    // while(i < width * height / 2) {
    //     i++;
    //     let start = gridPath.getRandomEmptyCell();
    //     if(start == null) continue;
    //     let path = gridPath.GenerateArrow(start, 10);
    //     // console.log(path);
    //     if (path == null) continue;
    //     let arrow = path.GetArrowElement();
    //     arrows.push(arrow);
    //     // console.log(arrow);
    //     svg?.appendChild(arrow);
    // }
    centersvg();
}
draw();
function restart() {
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
    drawGrid(props.width, props.height);
    // if(svg){
    //     // inner width
    //     svg.style.width = "100%";
    //     svg.style.height = "100%";
    // }
    gridPath = new GridPath();
    draw();
}
function centersvg() {
    let tX = props.width * props.scale / 2;
    let tY = props.height * props.scale / 2;
    let rect = svg?.getBoundingClientRect();
    if (rect) {
        tX = rect.width / 2 - tX;
        tY = rect.height / 2 - tY;
    }
    svg.dataTX = tX;
    svg.dataTY = tY;
    if (rootGroup)
        rootGroup.style.transform = `translate(${tX}px,${tY}px)`;
    if (gridGroup)
        gridGroup.style.transform = `translate(${tX}px,${tY}px)`;
}
let dragging = false;
let dragX = 0;
let dragY = 0;
const mouseMoveEvent = (clientX, clientY, buttons) => {
    // console.log(e.buttons, dragging);
    if (buttons !== 1) {
        if (dragging) {
            let tX = svg.dataTX ?? 0;
            let tY = svg.dataTY ?? 0;
            svg.dataTX = tX + clientX - dragX;
            svg.dataTY = tY + clientY - dragY;
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
        let tX = svg.dataTX ?? 0;
        let tY = svg.dataTY ?? 0;
        tX = tX + clientX - dragX;
        tY = tY + clientY - dragY;
        // svg?.setAttribute("transform", `translate(${tX}px,${tY}px)`);
        if (rootGroup)
            rootGroup.style.transform = `translate(${tX}px,${tY}px)`;
        if (gridGroup)
            gridGroup.style.transform = `translate(${tX}px,${tY}px)`;
    }
};
const mouseUpEvent = (clientX, clientY) => {
    if (dragging) {
        let tX = svg.dataTX ?? 0;
        let tY = svg.dataTY ?? 0;
        svg.dataTX = tX + clientX - dragX;
        svg.dataTY = tY + clientY - dragY;
        dragX = clientX;
        dragY = clientY;
        mouseUpBlocked = (Math.abs(svg.dataTX) > 5) || (Math.abs(svg.dataTY) > 5);
    }
    dragging = false;
};
window.addEventListener("mousemove", (ev) => {
    mouseMoveEvent(ev.clientX, ev.clientY, ev.buttons);
}, {
    capture: true,
    passive: true
});
let mouseUpBlocked = false;
window.addEventListener("mouseup", (ev) => {
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
