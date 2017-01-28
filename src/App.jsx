
import React from 'react';
import {observable, action, useStrict, computed, autorun} from 'mobx';
import {observer} from 'mobx-react';
import {Grid, Row, Col, PageHeader} from 'react-bootstrap';
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

// data Cell = null | Color | "ghost"
// type Field = [[Cell]]

// Constants
// --------------------------------------------------------------------------------

// milliseconds per game tick (TODO: what if we run out of levels?)
const lvlSpeeds       = [700, 630, 560, 500, 450, 410, 370, 330, 300, 260, 220, 190, 150, 120, 90, 70, 50]
const softDropSpeed   = 50

const lvlIncreaseStep = 6 // in number of lines cleared

// clearing score = (lvl + 1) * lineClearScores[number of lines cleared]
const lineClearScores = [0, 40, 100, 300, 1200]

const fieldWidth  = 10
const fieldHeight = 21

// starting position for each piece (this will cause them to be adjacent to the top of the field on start)
const initPosition = {x:-1, y:3}

const cellSizePx = Math.floor((window.innerHeight * 0.75) / fieldHeight)

const fieldWidthPx = cellSizePx * fieldWidth
const fieldHeightPx = cellSizePx * fieldHeight


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

// ghostPosition : Field -> Piece -> Pos -> Int -> {position: Pos, drops: Int}
const ghostPosition = (field, piece, pos, rotation) => {
  let pos2 = {x:pos.x, y:pos.y}
  let drops = 0
  while (!collides(field, piece, moveDown(pos2), rotation)){
    pos2 = moveDown(pos2)
    drops += 1
  }
  return {position: pos2, drops: drops}
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

  @computed get level()         { return Math.floor(this.linesCleared/lvlIncreaseStep);}
  @computed get baseSpeed()     { return lvlSpeeds[this.level] }
  @computed get speed()         { return this.softDrop ? softDropSpeed : this.baseSpeed }
  @computed get ghostPosition() { return ghostPosition(this.field, this.piece, this.position, this.rotation)}
  @computed get ghostPiece()    { return {rotations: this.piece.rotations, color: 'ghost'}}

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
  }

  @action initGame = () => {
    window.focus()
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

  @action resetTickTimer = () => {
    this.linesCleared = this.linesCleared;
  }

  @action initPiece = () => {
    this.resetTickTimer()
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
    this.initGame()
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
      if (this.softDrop){
        this.score += 1;
      }
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
    } else if (e.key === " "){
      const gpos = this.ghostPosition
      this.position = gpos.position
      this.score += gpos.drops * 2
      this.finalizePiece()
    }
  }

  @action keyDownAction = e => {
    if (e.key === "Shift"){
      this.softDrop = true
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

  @computed
  get fieldSVG(){
    const ghosty = mergePiece(this.field, this.ghostPiece, this.ghostPosition.position, this.rotation);
    const merged = mergePiece(ghosty, this.piece, this.position, this.rotation);
    let cellsSVG = []

    for (let i = 0; i < fieldHeight; i++){
      for (let j = 0; j < fieldWidth; j++){
        const cell  = merged[i][j]
        const color = cell === 'ghost' ? this.piece.color : cell ? cell : 'white'
        cellsSVG.push(
          <rect
            x={j*cellSizePx}
            y={i*cellSizePx}
            key={j*fieldHeight + i} 
            width={cellSizePx} 
            height={cellSizePx}
            style={{
              'fill':color, 
              'stroke':'gray', 
              'strokeWidth': cell ? '1px' : '0px', 
              'opacity': cell == 'ghost' ? 0.45 : 1}}
          />)
      }
    }
    return (
      <svg width={fieldWidthPx} height={fieldHeightPx} style={{'border':'2px solid gray'}}>
        {cellsSVG}
      </svg>
    )
  }

  @computed
  get nextPieceSVG(){
    const cellsSVG = this.nextPiece.rotations[0].map(({x, y}) => 
      <rect
        x={(y - 1)*cellSizePx}
        y={x*cellSizePx}
        key={y*4 + x} 
        width={cellSizePx} 
        height={cellSizePx}
        style={{
          'fill': this.nextPiece.color, 
          'stroke':'gray', 
          'strokeWidth': 'px'}}/>
    )
    return (
      <svg width={4*cellSizePx} height={4*cellSizePx}>
        {cellsSVG}
      </svg>
    )
  }

  render = () => {
    return (
      <Grid style={{'margin':'auto'}}>
        <Row>
          <Col md={5} lg={6}>
            <PageHeader style={{'borderBottom':'solid 2px', 'borderBottomColor':'gray'}}> 
              YATG <small> Yet another Tetris game </small>
            </PageHeader>
          </Col>
        </Row>
        <Row>
          <Col md={4} lg={4}>
            {this.fieldSVG}
          </Col>

          <Col md={2} lg={2}>
            <Row>
              <Col md={12} lg={12}>
                <h3> Score: {this.score} </h3>
              </Col>
            </Row>
            <Row>
              <Col md={12} lg={12}>
                <h3> Level: {this.level} </h3>
              </Col>
            </Row>
            <Row>
              <Col md={12} lg={12}>
                {this.nextPieceSVG}
              </Col>
            </Row>
            <Row>
              <Col md={12} lg={12}>
                <br/>
                <p> Shift: soft drop </p>
                <p> Space: hard drop </p>
                <p> Arrow keys: move & rotate </p>
              </Col>
            </Row>
          </Col>
        </Row>
      </Grid>
    )
  }
}

export {Game}