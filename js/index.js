const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function() {
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScattePlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){
        rParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#x').on('change', function(){
        xParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#y').on('change', function(){
        yParam = d3.select(this).property('value');
        updateScattePlot();
    });

    d3.select('#param').on('change', function(){
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function(){
        lineParam = d3.select(this).property('value');
        updateLine();
    });

    function updateBar(){
        let xRange = data.map(d => d['region'])
        xBar.domain(xRange)
        xBarAxis.call(d3.axisBottom(xBar));

        let regions = Array.from(new Set(data.map(item => item.region)));
        let groupByRegion = regions.map(item => {
            return data.filter(itemIn => {
                return itemIn.region === item;
            })
        });
        let meanValInRegions = groupByRegion.map(countryRegion => {
            return countryRegion.map(country => {
                let meanVal = d3.mean(countryRegion, d => +d[param][year])
                return eval(`({ ...country, meanVal: { ${ year }: meanVal } })`);
            })
        });
        data = meanValInRegions.reduce((first, second)=>{
            return first.concat(second);
        })

        let yRange = data.map(d => +d["meanVal"][year])
        yBar.domain([0, d3.max(yRange)])
        yBarAxis.call(d3.axisLeft(yBar))

        barChart.selectAll('rect').data(data)
            .enter().append('rect')
            .attr('x', d => xBar(d.region))
            .attr('y', d => yBar(d["meanVal"][year]))
            .attr('fill', d => colorScale(d.region))
            .attr("height", d => yBar(0) - yBar(d["meanVal"][year]))
            .attr('width', barWidth/6)

        barChart.selectAll('rect').data(data)
            .attr('x', d => xBar(d.region))
            .attr('y', d => yBar(d["meanVal"][year]))
            .attr('fill', d => colorScale(d.region))
            .attr("height", d => yBar(0) - yBar(d["meanVal"][year]))
            .attr('width', barWidth/6)
            .on("click", function(d) {
                barChart.selectAll('rect').transition()
                    .attr('fill-opacity', 0.1)
                    .style("opacity", 0.1);
                d3.select(this).transition()
                    .attr('fill-opacity', 1)
                    .style("opacity", 1);
                scatterPlot.selectAll(`circle`)
                    .attr("display", "none")
                scatterPlot.selectAll(`circle[region=${d.region}]`)
                    .attr("display", null)
            });
        return;
    }

    function updateScattePlot(){
        let xBubRange = data.map(d=> +d[xParam][year]);
        x.domain([d3.min(xBubRange), d3.max(xBubRange)]);
        xAxis.call(d3.axisBottom(x));

        let yBubRange = data.map(d => +d[yParam][year])
        y.domain([d3.min(yBubRange), d3.max(yBubRange)])
        yAxis.call(d3.axisLeft(y))

        let rRange = data.map(d => +d[rParam][year]);
        radiusScale.domain([d3.min(rRange), d3.max(rRange)])

        let circles = scatterPlot.selectAll('circle').data(data)
            .attr('cx', d => x(d[xParam][year]))
            .attr('cy', d => y(d[yParam][year]))
            .attr('fill', d => colorScale(d.region))
            .attr('region', d => (d.region))
            .attr('r', d => radiusScale(d[rParam][year]))
        circles.enter().append('circle')
            .attr('cx', d => x(d[xParam][year]))
            .attr('cy', d => y(d[yParam][year]))
            .attr('region', d => (d.region))
            .attr('fill', d => colorScale(d.region))
            .attr('r', d => radiusScale(d[rParam][year]))
            .on("click", function(d) {

                document.querySelector("#line-selector").removeAttribute("style");
                selected = d.country;
                countryName.html(selected);

                let countrySel = data.find(country => country.country === selected)
                let countrySelParamValues = Object.values(countrySel[lineParam])

                yLineRange = countrySelParamValues.map(x => Number.parseInt(x, 10))
                yLineRange = yLineRange.slice(0, 221)
                y.domain([d3.min(yLineRange), d3.max(yLineRange)])
                yLineAxis.call(d3.axisLeft(y))

                xLineRange = data.map(dat => { return Object.keys(dat[lineParam]);});
                xLineRange = xLineRange[0].map(x => Number.parseInt(x, 10));
                xLineRange = xLineRange.slice(0, 221)
                x.domain([d3.min(xLineRange), d3.max(xLineRange)])
                xLineAxis.call(d3.axisBottom(x))

                let new_data = xLineRange.map((item, number) => ({ year: item, value: yLineRange[number] }))

                line = d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d.value))

                scatterPlot.selectAll(`circle`)
                    .attr('stroke', 1)
                    .attr('stroke-width', 1)
                d3.select(this).raise().transition()
                    .attr('fill-opacity', 1)
                    .attr('stroke', 1)
                    .attr('stroke-width', 2)

                d3.selectAll('#lines')
                    .attr("display", "none")

                lineChart.append("path")
                    .datum(new_data)
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("d", line)
                    .attr("id", "lines");
            });
        return;
    }

    function updateLine(){
        let countrySel = data.find(country => country.country === selected)
        let countrySelParamValues = Object.values(countrySel[lineParam])

        margin2 = ({top: 20, right: 30, bottom: 30, left: 40})

        yLineRange = countrySelParamValues.map(x => Number.parseInt(x, 10))
        yLineRange = yLineRange.slice(0, 221)
        y.domain([d3.min(yLineRange), d3.max(yLineRange)])
        yLineAxis.call(d3.axisLeft(y))

        xLineRange = data.map(dat => { return Object.keys(dat[lineParam]);});
        xLineRange = xLineRange[0].map(x => Number.parseInt(x, 10));
        xLineRange = xLineRange.slice(0, 221)
        x.domain([d3.min(xLineRange), d3.max(xLineRange)])
        xLineAxis.call(d3.axisBottom(x))

        let new_data = xLineRange.map((item, number) => ({ year: item, value: yLineRange[number] }))
        console.log(new_data)

        line = d3.line()
            .defined(d => !isNaN(d.value))
            .x(d => x(d.year))
            .y(d => y(d.value))

        d3.selectAll('#lines')
            .attr("display", "none")

        lineChart.append("path")
            .datum(new_data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", line)
            .attr("id", "lines");
        return;
    }

    updateBar();
    updateScattePlot();

});


async function loadData() {
    const data = {
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };

    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}