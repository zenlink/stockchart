let chartDataArr = []
let maxValue
let minValue
const averageP = 20
const companyName = "IBM"
const url = `./${companyName}.csv`

// read raw data and process, draw
const getData = async function () {
    try {
        const response = await fetch(url)
        const data = await response.text()
        getChartData(data)
        draw()
    }
    catch (err) {
        console.log(err)
    }
}
// process data
function getChartData(txt) {
    let intialArr = txt.split("\n").slice(1)
    let len = intialArr.length

    // get date and close value
    for (let i = 0; i < len; i++) {
        const subArr = intialArr[i].split(",")
        chartDataArr.push([subArr[0], parseFloat(subArr[4])])
    }
    // get first average 
    let averageValue = chartDataArr.slice(len - averageP, len).reduce((sum, x) => {
        return sum + x[1]
    }, 0) / averageP
    // get averages, max and min of close values
    chartDataArr[len - 1].push(averageValue)
    maxValue = chartDataArr[0][1]
    minValue = chartDataArr[0][1]
    for (let j = len - 2; j >= averageP - 1; j--) {
        let average = averageValue + (chartDataArr[j - averageP + 1][1] - chartDataArr[j + 1][1]) / averageP
        maxValue = maxValue < chartDataArr[j][1] ? chartDataArr[j][1] : maxValue
        minValue = minValue > chartDataArr[j][1] ? chartDataArr[j][1] : minValue
        chartDataArr[j].push(average)
        averageValue = average
    }
    // add extra space for top and bottom in chart
    minValue -= .1 * (maxValue - minValue)
    maxValue += .1 * (maxValue - minValue)
}

// draw in canvas
function draw() {
    const mediaQuery=1200
    const marginW = window.innerWidth > mediaQuery ? 150 : 80
    const marginH = 100
    const horizontalP = 6
    const verticalP = window.innerWidth > mediaQuery ? 11 : 5
    const color1 = "white"
    const color2 = "red"
    const color3 = "#696969"

    if (chartDataArr.length === 0)
        return
    const canvas = document.querySelector("canvas")
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    let ctx = canvas.getContext("2d")

    // declare chart start and end positions
    let top = marginH
    let bottom = window.innerHeight - marginH
    let left = marginW
    let right = window.innerWidth - marginW

    let graphWidth = window.innerWidth - 2 * marginW
    let graphHeight = window.innerHeight - 2 * marginH
    // start from 20
    let arr = chartDataArr.slice(averageP)
    let len = arr.length

    // draw x and y axis
    ctx.fillStyle = color1
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    ctx.font = "1rem Arial"
    ctx.beginPath()
    ctx.strokeStyle = color1
    ctx.moveTo(left, bottom)
    ctx.lineTo(right, bottom)
    ctx.lineTo(right, top)
    ctx.stroke()
    ctx.fillText(minValue.toFixed(2), right + 15, bottom);

    // draw reference horizontal lines + mark values   
    let horizontalRatio = graphHeight / horizontalP
    for (let i = 1; i <= horizontalP; i++) {
        ctx.beginPath()
        ctx.strokeStyle = color3
        ctx.moveTo(left, bottom - horizontalRatio * i)
        ctx.lineTo(right, bottom - horizontalRatio * i)
        ctx.setLineDash([5, 5])
        ctx.stroke()
        ctx.fillText((minValue + (maxValue - minValue) * i / horizontalP).toFixed(2), right + 15, bottom - horizontalRatio * i)
    }

    // draw reference vertical lines + mark dates   
    let verticalRatio = graphWidth / verticalP
    for (let j = 0; j < verticalP; j++) {
        ctx.beginPath()
        ctx.strokeStyle = color3
        ctx.moveTo(left + verticalRatio * j, top)
        ctx.lineTo(left + verticalRatio * j, bottom)
        ctx.stroke()
        let date = arr[Math.floor(len * j / verticalP)][0]
        ctx.fillText(date, left + verticalRatio * j - 45, bottom + 20)
    }

    // draw legend for average
    drawLegend(color2, 1, `${averageP}-day average`)

    // draw legend for close
    drawLegend(color1, 2, "close")

    // draw company name
    ctx.font = "1.8rem Arial"
    ctx.fillText(`${companyName}`, left, top - 10);

    // draw average  
    drawLineChart(color2, 2)

    // draw close Vale 
    drawLineChart(color1, 1)

    // draw legend function
    function drawLegend(color, index, str) {
        ctx.fillStyle = color
        if (window.innerWidth > mediaQuery) {
            ctx.beginPath()
            ctx.setLineDash([])
            ctx.strokeStyle = color
            ctx.moveTo((graphWidth * index / 3 + left - 80), bottom + 45)
            ctx.lineTo(graphWidth * index / 3 + left - 10, bottom + 45)
            ctx.stroke()
            ctx.fillText(` ${str}`, graphWidth * index / 3 + left, bottom + 50);
        } else {
            ctx.fillText(` ${str}`, index * 150, bottom + 50);
        }
    }
    // draw line chart function
    function drawLineChart(color, index) {
        let valueRatio = graphHeight / (maxValue - minValue)
        let dateRatio = graphWidth / len
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.lineJoin = "round"
        ctx.strokeStyle = color
        ctx.moveTo(left, (bottom - (arr[0][index] - minValue) * valueRatio))
        for (var k = 1; k < len; k++) {
            ctx.lineTo(dateRatio * k + left, (bottom - (arr[k][index] - minValue) * valueRatio))
        }
        ctx.stroke()
    }

    // mouse event
    // save partial canvas imgdata,later put back to canvas
    let imgData
    // previous mounse X position
    let prevMouseX

    // handle mouse move
    canvas.onmousemove = (e) => {
        let range = canvas.getBoundingClientRect();
        let xValue = e.clientX - range.left
        let yValue = e.clientY - range.top
        // restore canvas
        if (imgData) {
            ctx.putImageData(imgData, prevMouseX - 150, top)
        }
        // if mouse is in chart
        if (xValue > left && xValue < right && yValue > top && yValue < bottom) {
            // find current chart array index by mouse position
            let index = Math.round((xValue - left) * len / graphWidth)
            if (index < len) {
                // save previous x
                prevMouseX = xValue - 1
                imgData = ctx.getImageData(prevMouseX - 150, top, 300, graphHeight)
                // draw indicator
                ctx.beginPath()
                ctx.font = "1rem Arial"
                ctx.strokeStyle = color3
                ctx.moveTo(xValue, top)
                ctx.lineTo(xValue, bottom)
                ctx.stroke()
                // draw and show label
                ctx.fillStyle = "rgba(121,121,121,0.3)"
                let switchW = window.innerWidth / 2
                let h = window.innerHeight / 2
                let c = 10
                ctx.fillRect(xValue < switchW ? xValue : xValue - 120, h - 40, 120, 100);
                ctx.fillStyle = color1
                ctx.fillText(arr[index][0], xValue < switchW ? xValue + c : xValue - 100 - c, h);
                ctx.fillText(`close:${arr[index][1].toFixed(2)}`, xValue < switchW ? xValue + c : xValue - 100 - c, h + 20);
                ctx.fillText(`avg${averageP} :${arr[index][2].toFixed(2)}`, xValue < switchW ? xValue + c : xValue - 100 - c, h + 40);
            }
        }
    }
}
// load
document.body.onload = () => getData()
// resize
window.addEventListener("resize", () => draw())