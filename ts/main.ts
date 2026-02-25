/**
 * Creates a seeded pseudorandom number generator (Mulberry32 algorithm)
 * @param {number} seed - Any integer seed value
 * @returns {function} - Function that returns a random number in [0, 1)
 */
function seededRandomGenerator(seed: number) {
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
let rngSeed = parseInt(localStorage.getItem("rngSeed") || "0");
if(rngSeed == 0){
    rngSeed = Math.floor(Math.random()* 4836651);
    localStorage.setItem("rngSeed", rngSeed.toString());
}


const rng = seededRandomGenerator(rngSeed);
function Rand(){
    return seededRandomGenerator(rngSeed++)()
}
// if(false){
//     let innerWidth =  (window.innerWidth - 100)/scale -5;
//     let innerHeight = (window.innerHeight - 100)/scale -5;
//         width = innerWidth;
//         height = innerHeight;
//     console.log({width, height,innerWidth:window.innerWidth,innerHeight:window.innerHeight});
// }
const gridPath = new GridPath();
document.getElementById("arrow-head")?.setAttribute("markerHeight", scale/6+'');
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
function drawGrid(x: number, y: number) {
    let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    document.getElementById("svg")?.appendChild(group);
    for (let i = 1; i <= x + 2; i++) {
        for (let j = 1; j <= y + 2; j++) {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", (i * scale).toString());
            rect.setAttribute("y", (j * scale).toString());
            group.appendChild(rect);
        }
    }
}

const svg = document.getElementById("svg");


let count = 0;

drawGrid(width, height);
if(svg){
    // inner width
    
    svg.style.width = `${width * scale + 100}px`;
    svg.style.height = `${height * scale + 100}px`;
}
let arrows: SVGPathElement[] = [];
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
    console.log("Grid",JSON.parse(JSON.stringify(gridPath.Grid)));
    console.log("draw");
    for(let i = 0; i < maxRank; i++){
        let cells = gridPath.getPeremeterCells(i);
        cells = cells.sort((a,b)=>Rand() - 0.5);
        console.log(`get Peremeter Cells ${i}`,JSON.parse(JSON.stringify(cells)));
        cells = cells.filter(cell=>cell.Arrow == null);
        console.log(`get Empty Peremeter Cells ${i}`,JSON.parse(JSON.stringify(cells)));
        for(let cell of cells){
            if(cell.Arrow != null) continue;
            let arrow = gridPath.GenerateArrow(cell, maxLength, i);
            if(arrow == null) continue;
            let [arrowElement,collisionElement] = arrow.GetArrowElement();
            arrows.push(arrowElement);
            arrows.push(collisionElement);
            svg?.appendChild(collisionElement);
            svg?.appendChild(arrowElement);
        }
    }
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
}
draw();
let button = document.createElement("button");
button.innerHTML = "reload";
button.addEventListener("click", () => {
    rngSeed = Math.floor(Math.random()* 4836651);
    localStorage.setItem("rngSeed", rngSeed.toString());
    location.reload();
});
document.body.appendChild(button);
