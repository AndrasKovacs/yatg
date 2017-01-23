
// Pieces
// --------------------------------------------------------------------------------
// Colors come from "Super Tetris 3"
// https://en.wikipedia.org/wiki/Tetris#Colors_of_Tetriminos

const pI = {
  rotations: [
  ["    ",
   "xxxx",
   "    ",
   "    "],
  ["  x ",
   "  x ",
   "  x ",
   "  x "],
  ["    ",
   "    ", 
   "xxxx",
   "    "],
  [" x  ",
   " x  ",
   " x  ",
   " x  "],
  ],
  color: 'blue'
}

const pJ = {
  rotations: [
  ["    ",
   " x  ",
   " xxx",
   "    "],
  ["    ",
   "  xx",
   "  x ",
   "  x "],
  ["    ",
   "    ", 
   " xxx",
   "   x"],
  ["    ",
   "  x ",
   "  x ",
   " xx "],
  ],
  color: 'orange'
}

const pL = {
  rotations: [
  ["    ",
   "   x",
   " xxx",
   "    "],
  ["    ",
   "  x ",
   "  x ",
   "  xx"],
  ["    ",
   "    ", 
   " xxx",
   " x  "],
  ["    ",
   " xx ",
   "  x ",
   "  x "],
  ],
  color: 'lime'
}

const pO = {
  rotations: [
  ["    ",
   " xx ",
   " xx ",
   "    "],
  ],
  color: 'magenta'
}

const pS = {
  rotations: [
  ["    ",
   "  xx",
   " xx ",
   "    "],
  ["    ",
   "  x ",
   "  xx",
   "   x"],
  ["    ",
   "    ", 
   "  xx",
   " xx "],
  ["    ",
   " x  ",
   " xx ",
   "  x "],
  ],
  color: 'cyan'
}

const pZ = {
  rotations: [
  ["    ",
   " xx ",
   "  xx",
   "    "],
  ["    ",
   "   x",
   "  xx",
   "  x "],
  ["    ",
   "    ", 
   " xx",
   "  xx"],
  ["    ",
   "  x ",
   " xx ",
   " x  "],
  ],
  color: 'red'
}

const pT = {
  rotations: [
  ["    ",
   "  x ",
   " xxx",
   "    "],
  ["    ",
   "  x ",
   "  xx",
   "  x "],
  ["    ",
   "    ", 
   " xxx",
   "  x "],
  ["    ",
   "  x ",
   " xx ",
   "  x "],
  ],
  color: 'yellow'
}

//pieces : [Piece]
const pieces = [pI, pJ, pL, pO, pS, pZ, pT].map(({rotations, color}) => {

  // parseRotation : [String] -> [[Pos]]
  const parseRotation = lines => {
    let res = []
    for (let i = 0; i < lines.length; ++i){
      let line = lines[i]
      for (let j = 0; j < line.length; ++j){
        if (line[j] === 'x'){
          res.push({x: i, y: j});
        }   
      }
    }
    return res;
  }
  return {rotations: rotations.map(parseRotation), color:color}
})

const randomPiece = () => pieces[Math.floor(Math.random()*pieces.length)]
export {randomPiece};
