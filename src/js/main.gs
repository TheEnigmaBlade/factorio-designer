var c = $("#main-canvas")[0],
	cg = c.getContext("2d")

var sidebarWidth = $("#main-sidebar").outerWidth()

var DEBUG = true
var PRIMARY_BUTTON = 0,
	SCROLL_BUTTON = 1,
	SCROLL_MODIFIER = "alt",
	DELETE_MODIFIER = "shift"

// State

var drawWidth = c.width,
	drawHeight = c.height,
	tileWidth = 0,
	tileHeight = 0,
	tileSize = 32,
	tileHalfSize = tileSize/2,
	offsetX = 0,
	offsetY = 0,
	minVisTileX = 0,
	minVisTileY = 0,
	maxVisTileX = 0,
	maxVisTileY = 0,
	showHover = true,
	hoverTileX = -1,
	hoverTileY = -1,
	hoverConflict = false,
	hoverConflictItem = null,
	lastTileX = -1,
	lastTileY = -1
	
var tiles = {},
	currentItem = null,
	currentAngle = 0

fun resize {
	drawWidth = cg.canvas.width = window.innerWidth - sidebarWidth
	drawHeight = cg.canvas.height = window.innerHeight
	tileWidth = drawWidth /# tileSize
	tileHeight = drawHeight /# tileSize
	updateTileVisibility()
}

$(window).resize({{
	resize()
	draw()
}})

fun init {
	resize()
	draw()
}

// Utilities

fun iterTiles(callback) {
	for key in _.keys(tiles) {
		if callback(tiles[key]) {
			return true
		}
	}
	return false
}

fun findTileKey(cond) {
	for key in _.keys(tiles) {
		if cond(tiles[key]) {
			return key
		}
	}
	return null
}

// Drawing

var bgColor = "rgb(39,166,204)",//"#27A6CC",
	gridColor = "rgba(156,229,251, 0.5)",//"#9CE5FB",
	textColor = "#FFF"

var hoverColor = "rgba(0, 255, 150, 0.3)",
	hoverErrorColor = "rgba(255, 150, 150, 0.5)",
	hoverArrowColor = "#FFF",
	powerColor = "rgba(100, 120, 255, 0.7)"

var draw = $.throttle(15, {{
	//cg.clearRect(0, 0, drawWidth, drawHeight)
	
	cg.beginPath()
	cg.fillStyle = bgColor
	cg.fillRect(0, 0, drawWidth, drawHeight)
	cg.closePath()
	cg.fillStyle = bgColor
	cg.fill()
	
	drawPower()
	drawGrid()
	drawTiles()
	if showHover {
		drawHoverHighlight()
	}
	if DEBUG {
		drawDebug()
	}
}})

fun drawGrid {
	cg.beginPath()
	for x in (offsetX % tileSize)..drawWidth by tileSize {
		if x >= 0 {
			cg.moveTo(x, 0)
			cg.lineTo(x, drawHeight)
		}
	}
	for y in (offsetY % tileSize)..drawHeight by tileSize {
		if y >= 0 {
			cg.moveTo(0, y)
			cg.lineTo(drawWidth, y)
		}
	}
	cg.closePath()
	
	cg.strokeStyle = gridColor
	cg.lineWidth = 2
	cg.stroke()
}

fun drawPower {
	cg.fillStyle = powerColor
	
	iterTiles({{:tile:
		drawCenteredRange(tile.x, tile.y, tile.data)
	}})
	
	cg.fill()
}

fun drawCenteredRange(x, y, data, draw) {
	if data.range > 0 {
		var left = x - data.range,
			top = y - data.range,
			width = data.width + data.range*2,
			height = data.height + data.range*2
		cg.beginPath()
		cg.fillRect(left*tileSize + offsetX, top*tileSize + offsetY, width*tileSize, height*tileSize)
		cg.closePath()
		
		if draw {
			cg.fill()
		}
	}
}

fun drawTiles {
	iterTiles({{:tile:
		if tile.x+tile.width-1 < minVisTileX or tile.x > maxVisTileX or tile.y+tile.height-1 < minVisTileY or tile.y > maxVisTileY {
			return
		}
		
		var x = tile.x*tileSize + offsetX,
			y = tile.y*tileSize + offsetY,
			w = tile.data.width*tileSize,
			h = tile.data.height*tileSize
		
		// Draw rotated base image
		cg.translate(x+tileHalfSize, y+tileHalfSize)
		cg.rotate(tile.angle)
		
		if tile.data.baseImage {
			cg.drawImage(tile.data.baseImage, -tileHalfSize, -tileHalfSize, w, h)
		}
		else if tile.data.image {
			cg.drawImage(tile.data.image, -tileHalfSize, -tileHalfSize, w, h)
		}
		else {
			cg.beginPath()
			cg.fillRect(x, y, w, h)
			cg.closePath()
		}
		
		cg.setTransform(1, 0, 0, 1, 0, 0)
		
		// Draw non-rotated overlay image if required
		if tile.data.baseImage and tile.data.image {
			var cx = x + tile.data.width*tileHalfSize - tile.data.image.width/2,
				cy = y + tile.data.height*tileHalfSize - tile.data.image.height/3*2
			
			cg.save()
			cg.shadowOffsetX = 0
			cg.shadowOffsetY = 0
			cg.shadowColor = "white"
			cg.shadowBlur = 10
			cg.drawImage(tile.data.image, cx, cy)
			cg.restore()
		}
	}})
}

fun drawHoverHighlight {
	if currentItem {
		drawCenteredRange(hoverTileX, hoverTileY, currentItem, true)
		
		// Draw background
		cg.fillStyle = hoverConflict ? hoverErrorColor : hoverColor
		cg.beginPath()
		cg.fillRect(hoverTileX*tileSize + offsetX, hoverTileY*tileSize + offsetY, currentItem.width*tileSize, currentItem.height*tileSize)
		cg.closePath()
		
		// Draw arrow
		if currentItem.rotatable {
			cg.translate(hoverTileX*tileSize + currentItem.width*tileHalfSize, hoverTileY*tileSize + currentItem.height*tileHalfSize)
			cg.rotate(currentAngle)
			
			cg.lineWidth = 4
			cg.strokeStyle = hoverArrowColor
			drawArrow(0, currentItem.height*tileHalfSize, 0, -currentItem.height*tileHalfSize)
			
			cg.setTransform(1, 0, 0, 1, 0, 0)
		}
		
		cg.fill()
	}
}

fun drawDebug {
	// Debug geom
	cg.beginPath()
	cg.moveTo(offsetX, 0)
	cg.lineTo(offsetX, drawHeight)
	cg.closePath()
	cg.strokeStyle = "#FAA"
	cg.stroke()
	
	cg.beginPath()
	cg.moveTo(0, offsetY)
	cg.lineTo(drawWidth, offsetY)
	cg.closePath()
	cg.strokeStyle = "#AFA"
	cg.stroke()
	
	// Debug text
	var xPad = 10,
		yPad = 10,
		textHeight = 11
	cg.font = "11pt Verdana"
	cg.fillStyle = textColor
	cg.strokeStyle = bgColor
	cg.lineWidth = 3
	
	var currentLine = 1
	fun drawTextLine(text) {
		var y = (yPad+textHeight)*currentLine
		cg.strokeText(text, xPad, y)
		cg.fillText(text, xPad, y)
		currentLine += 1
	}
	
	cg.beginPath()
	
	drawTextLine("Offset: ("+offsetX+", "+offsetY+")")
	drawTextLine("Tile size: "+tileSize)
	drawTextLine("Min vis tile: ("+minVisTileX+", "+minVisTileY+")")
	drawTextLine("Max vis tile: ("+maxVisTileX+", "+maxVisTileY+")")
	drawTextLine("Hovered tile: ("+hoverTileX+", "+hoverTileY+")")
	drawTextLine("Num tiles: "+_.size(tiles))
	
	cg.closePath()
	
	cg.stroke()
	cg.fill()
}

//// Draw utilities

fun drawArrow(fromx, fromy, tox, toy) {
	// http://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
	var angle = Math.atan2(toy-fromy,tox-fromx),
		headAngle = Math.PI/7,
		headLen = 10
	
	//starting path of the arrow from the start square to the end square and drawing the stroke
	cg.beginPath()
	cg.moveTo(fromx, fromy)
	cg.lineTo(tox, toy)
	cg.stroke()
	
	//starting a new path from the head of the arrow to one of the sides of the point
	//cg.beginPath()
	cg.moveTo(tox, toy)
	cg.lineTo(tox-headLen*Math.cos(angle-headAngle),toy-headLen*Math.sin(angle-headAngle))
	
	//path from the side point of the arrow, to the other side point
	cg.lineTo(tox-headLen*Math.cos(angle+headAngle),toy-headLen*Math.sin(angle+headAngle))
	
	//path from the side point back to the tip of the arrow, and then again to the opposite side point
	cg.lineTo(tox, toy)
	cg.lineTo(tox-headLen*Math.cos(angle-headAngle),toy-headLen*Math.sin(angle-headAngle))
	
	cg.closePath()
	
	//draws the paths created above
	cg.stroke()
	//cg.fillStyle = "#cc0000"
	//cg.fill()
}

// Input

var pressed = false,
	scrollPressed = false,
	dragging = false,
	dragSensitivity = 3,
	mouseX = 0,
	mouseY = 0

fun tileActionInput(e) {
	if e[DELETE_MODIFIER+"Key"] {
		return delTile(hoverTileX, hoverTileY)
	}
	else {
		return setTile(hoverTileX, hoverTileY)
	}
}

c.onmousedown = {{:e:
	mouseX = e.pageX - c.offsetLeft
	mouseY = e.pageY - c.offsetTop
	
	// Change states based on button
	if e.button == 1 or (e.button == 0 and e[SCROLL_MODIFIER+"Key"]) {
		scrollPressed = true
	}
	else if e.button == 0 {
		pressed = true
	}
	
	// Update tiles if possible
	if pressed and not dragging {
		tileActionInput(e)
		draw()
	}
}}

c.onmouseup = {{:e:
	pressed = scrollPressed = false
	dragging = false
	if currentItem {
		showHover = true
	}
}}

c.onmousemove = {{:e:
	newX = e.pageX - c.offsetLeft
	newY = e.pageY - c.offsetTop
	
	var doDraw = false
	
	// Update hover information and tile conflicts
	hoverTileX = (newX-offsetX) /# tileSize
	hoverTileY = (newY-offsetY) /# tileSize
	var tileChanged = hoverTileX != lastTileX or hoverTileY != lastTileY
	
	if tileChanged {
		doDraw = true
		
		// Find tile conflicts
		hoverConflict = false
		if currentItem {
			iterTiles({{:tile:
				if tile.overlapsTileData(hoverTileX, hoverTileY, currentItem) {
					hoverConflict = true
					hoverConflictItem = tile.data
					return true
				}
			}})
		}
	}
	
	// Update input based on drag state
	if dragging {
		if pressed and tileChanged {
			doDraw |= tileActionInput(e)
		}
		elif scrollPressed {
			offsetX += newX - mouseX
			offsetY += newY - mouseY
			updateTileVisibility()
			doDraw = true
		}
		mouseX = newX
		mouseY = newY
	}
	elif pressed or scrollPressed {
		var diffX = newX - mouseX,
			diffY = newY - mouseY
		if Math.sqrt(diffX**2, diffY**2) >= dragSensitivity {
			dragging = true
			mouseX = newX
			mouseY = newY
			
			if scrollPressed {
				offsetX += diffX
				offsetY += diffY
				showHover = false
				doDraw = true
			}
		}
	}
	
	lastTileX = hoverTileX
	lastTileY = hoverTileY
	
	if doDraw {
		draw()
	}
}}

$(c).mouseenter({{
	showHover = true
	draw()
}})

$(c).mouseleave({{
	showHover = false
	draw()
}})

$(c).mousewheel({{:e:
	var zoomDist = e.deltaY
	if zoomDist > 0 {
		tileSize *= 2**zoomDist
	}
	else {
		tileSize /= 2**(-zoomDist)
	}
	tileHalfSize = tileSize/2
	
	resize()
	draw()
}})

$(window).keypress({{:e:
	if e.key == "r" {
		print("Rotating tile @ ("+hoverTileX+", "+hoverTileY+")")
		currentAngle += Math.PI/2
		if currentAngle >= 2*Math.PI {
			currentAngle -= 2*Math.PI
		}
		
		var hoverTile = getTile(hoverTileX, hoverTileY)
		if hoverTile and hoverTile.data.rotatable {
			hoverTile.angle += Math.PI/2
			if hoverTile.angle >= 2*Math.PI {
				hoverTile.angle -= 2*Math.PI
			}
			print("  New angle="+hoverTile.angle)
			
			draw()
		}
		else {
			print("  No tile")
			if showHover {
				draw()
			}
		}
	}
	elif e.key == "q" {
		print("Clearing selected item")
		clearSelectedItem()
	}
}})

// Main functionality

fun Tile(tileX, tileY, data) {
	this.x = tileX
	this.y = tileY
	this.angle = data.rotatable ? currentAngle : 0
	this.data = data
}

Tile.proto.overlapsTile = fun(x, y, w, h) {
	return this.x < x + w and this.x + this.data.width > x and this.y < y + h and this.y + this.data.height > y
}

Tile.proto.overlapsTileData = fun(x, y, data) {
	return this.x < x + data.width and this.x + this.data.width > x and this.y < y + data.height and this.y + this.data.height > y
}

fun tileKey(tileX, tileY) {
	return tileX+"x"+tileY
}

fun setTile(tileX, tileY) {
	if not currentItem {
		error("Can't set tile: no item selected")
		return false
	}
	if hoverConflict {
		// Kind-of hacky, but should work for now
		//if currentItem.image != hoverConflictItem.image {
			error("Can't set tile: overlap")
			return false
		//}
	}
	print("Setting tile @ ("+tileX+", "+tileY+")")
	tiles[tileKey(tileX, tileY)] = new Tile(tileX, tileY, currentItem)
	return true
}

fun getTile(tileX, tileY) {
	var key = tileKey(tileX, tileY)
	if not tiles[key] {
		key = findTileKey({{:tile:
			if tile.overlapsTile(tileX, tileY, 1, 1) {
				return true
			}
			return false
		}})
	}
	if key {
		return tiles[key]
	}
	return null
}

fun delTile(tileX, tileY) {
	print("Deleting tile @ ("+tileX+", "+tileY+")")
	
	var key = tileKey(tileX, tileY)
	if not tiles[key] {
		key = findTileKey({{:tile:
			if tile.overlapsTile(tileX, tileY, 1, 1) {
				return true
			}
			return false
		}})
	}
	
	if key {
		del tiles[key]
		return true
	}
	else {
		error("Can't delete tile: none found")
		return false
	}
}

fun clearTiles {
	print("Clearing tiles")
	tiles = {}
}

fun updateTileVisibility {
	minVisTileX = -offsetX /# tileSize
	minVisTileY = -offsetY /# tileSize
	maxVisTileX = tileWidth + minVisTileX
	maxVisTileY = tileHeight + minVisTileY
}

// Interaction with page UI

var $items = $(".item")

$items.click({{
	var $this = $(this),
		active = $this.hasClass("active")
	print("Item clicked: active="+active)
	
	clearSelectedItem()
	if not active {
		currentItem = getItemData($this)
		$this.addClass("active")
	}
}})

fun getItemData($item) {
	return {
		width: $item.data("width") or 1,
		height: $item.data("height") or 1,
		range: $item.data("range") or 0,
		image: $item.data("img") ? $("#"+$item.data("img"))[0] : $item.find("img")[0],
		baseImage: $item.data("base-img") ? $("#"+$item.data("base-img"))[0] : null,
		rotatable: $item.data("rotatable") or false
	}
}

fun clearSelectedItem() {
	$items.removeClass("active")
	currentItem = null
}

$("#option-debug").change({{
	DEBUG = this.checked
	draw()
}})

$("#clear-tiles").click({{
	clearTiles()
	draw()
}})

// Start

init()
