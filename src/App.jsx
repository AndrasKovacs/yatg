
import React from 'react';
import {observable, action, useStrict, computed, autorun} from 'mobx';
import {observer} from 'mobx-react';
import DevTools from 'mobx-react-devtools';

import {randomPiece} from './Pieces.jsx';

useStrict(true)

// Rotation system: no wall kicks, lock delay
// Scoring: no drop bonus, only clearing
// Levels: increases automatically after clearing 10 lines
// We have ghost piece

// Types
// --------------------------------------------------------------------------------

// data Pos = {x : Int, y: Int}
// data Piece = {rotations: [[Pos]], color: String}

// data Cell = null | Color   
// type Field = [[Cell]]

// Constants
// --------------------------------------------------------------------------------

// milliseconds per game tick (TODO: what if we run out of levels?)
const lvlSpeeds       = [700, 550, 400, 316, 250, 200, 166, 133, 100, 83, 70, 60, 50, 40, 30, 20, 15, 10]
const softDropSpeed   = 50

const lvlIncreaseStep = 10 // in number of lines cleared

// clearing score = (lvl + 1) * lineClearScores[number of lines cleared]
const lineClearScores = [0, 40, 100, 300, 1200]

const fieldWidth  = 10
const fieldHeight = 20

// starting position for each piece (this will cause them to be adjacent to the top of the field on start)
const initPosition = {x:-1, y:4}

// Pure functions
// --------------------------------------------------------------------------------

// rotLeft, rotateRight : Piece -> Int -> Int
const rotateLeft  = ({rotations}, rotation) => ((rotation === 0) ? rotations.length - 1 : rotation - 1)
const rotateRight = ({rotations}, rotation) => ((rotation === rotations.length - 1) ? 0 : rotation + 1)

// moveLeft, moveRight, moveDown : Pos -> Pos
const moveLeft  = ({x, y}) => ({x: x,     y: y - 1})
const moveRight = ({x, y}) => ({x: x,     y: y + 1})
const moveDown  = ({x, y}) => ({x: x + 1, y: y    })

// collides : Field -> Piece -> Pos -> Int -> Bool
const collides = (field, piece, {x, y}, rotation) => {
  for (const pos of piece.rotations[rotation]){
    const x2 = pos.x + x
    const y2 = pos.y + y
    if (x2 < 0 | x2 >= fieldHeight | y2 < 0 | y2 >= fieldWidth){
      return true;
    }
    if (field[x2][y2] !== null){
      return true;
    }
  }
  return false;
}

// ghostPosition : Field -> Piece -> Pos -> Int -> Pos
const ghostPosition = (field, piece, pos, rotation) => {
  let pos2 = {x:pos.x, y:pos.y}
  while (!collides(field, piece, moveDown(pos2), rotation)){
    pos2 = moveDown(pos2)
  }
  return pos2
}

// merge a piece to a field
const mergePiece = (field, piece, {x, y}, rotation) => {
  let res = field.map(a => a.slice())
  for (const pos of piece.rotations[rotation]){
    res[pos.x + x][pos.y + y] = piece.color
  }
  return res;
}

// clear filled lines
const clearLines = field => {
  const filtered = field.filter(row => ! row.every(c => c !== null));
  const linesCleared = fieldHeight - filtered.length
  const padded = Array(linesCleared).fill(Array(fieldWidth).fill(null)).concat(filtered)
  return {cleared: padded, linesCleared: linesCleared}
}

// --------------------------------------------------------------------------------

@observer
class Game extends React.Component {
  @observable field
  @observable linesCleared
  @observable score
  @observable softDrop 
  @observable piece
  @observable rotation  
  @observable position 
  @observable nextPiece

  @computed get level()    { return Math.floor(this.linesCleared/lvlIncreaseStep);}
  @computed get baseSpeed(){ return lvlSpeeds[this.level] }
  @computed get speed()    { return this.softDrop ? softDropSpeed : this.baseSpeed }

  tickID;
  tickUpdater;

  //----------------------------------------------------------------------
  debugRender = () => {
    const merged    = mergePiece(this.field, this.piece, this.position, this.rotation)
    const displayed = merged.map(arr => arr.map(c => (c === null) ? " " : "x").join("")).join("\n").concat(["\n----------"])
    console.log(displayed)
    console.log(this.score, this.linesCleared, this.level, this.speed)
  }
  //----------------------------------------------------------------------

  constructor(props){
    super(props)
    this.initGame()
    this.initPiece()
  }

  @action initGame = () => {
    this.nextPiece = randomPiece()
    this.field = Array(fieldHeight).fill(Array(fieldWidth).fill(null))
    this.linesCleared = 0
    this.score = 0
    this.softDrop = false
    this.initPiece()

    document.addEventListener("keydown", this.keyDownAction)
    document.addEventListener("keyup", this.keyUpAction)

    this.tickUpdater = autorun(() => {
      clearInterval(this.tickID)
      this.tickID = setInterval(this.tickAction, this.speed)
    })
  }

  @action initPiece = () => {
    this.piece = this.nextPiece
    this.nextPiece = randomPiece()
    this.rotation = 0
    this.position = initPosition
    if (collides(this.field, this.piece, this.position, this.rotation)){
      this.gameOver()
    } 
  }

  gameOver = () => {
    document.removeEventListener("keydown", this.keyDownAction)
    document.removeEventListener("keyup", this.keyUpAction)
    clearInterval(this.tickID)
    this.tickUpdater()
    alert('Game Over! Your score is ' + this.score.toString())
  }

  @action finalizePiece = () => {
      const merged = mergePiece(this.field, this.piece, this.position, this.rotation)
      const {cleared, linesCleared} = clearLines(merged)
      this.score += (this.level + 1) * lineClearScores[linesCleared]
      this.linesCleared += linesCleared
      this.field = cleared
      this.initPiece()
  }

  @action tickAction = () => {
    const pos2 = moveDown(this.position)
    if (collides(this.field, this.piece, pos2, this.rotation)){
      this.finalizePiece()
    } else {
      this.position = pos2
    }
  }

  @action updatePosition = pos2 => {
    if (!collides(this.field, this.piece, pos2, this.rotation)){
      this.position = pos2
    }
  }

  @action updateRotation = rot2 => {
    if (!collides(this.field, this.piece, this.position, rot2)){
      this.rotation = rot2;
    }
  }

  @action keyUpAction = e => {
    if (e.key === "Shift"){
      this.softDrop = false
    }
  }

  @action keyDownAction = e => {
    if (e.key === "Shift"){
      this.softDrop = true
    } else if (e.key === " "){
      this.position = ghostPosition(this.field, this.piece, this.position, this.rotation)
      this.finalizePiece()
    } else if (e.key === "ArrowLeft"){
      this.updatePosition(moveLeft(this.position))
    } else if (e.key === "ArrowRight"){
      this.updatePosition(moveRight(this.position))
    } else if (e.key === "ArrowUp"){
      this.updateRotation(rotateRight(this.piece, this.rotation))
    } else if (e.key === "ArrowDown"){
      this.updateRotation(rotateLeft(this.piece, this.rotation))
    }
  } 

  render = () => {
    this.debugRender()
    return (<div> hello world </div>)
  }
}

export {Game}