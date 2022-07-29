const blurb_1 = "NASA's Jet Propulsion Laboratory (JPL) operates Sentry, an automated system for monitoring potential asteriod impacts with Earth.<p>Click \"Next\" to continue."
const blurb_2 = "As of early 2022, there are 134 objects with a greater than 1 in 10,000 chance of hitting earth in the next century.<p>Click on an asteroid to learn more."
const blurb_3 = "These objects come in a huge range of shapes and sizes."
const blurb_4 = "Lets take a look at them to-scale for a moment.<p>Most are about the size of a house, or car."
const blurb_5 = "The rest are up to a half football field in size..."
const blurb_6 = "Except for 101955 Bennu, which is in class of its own.<p>This enormous asteroid is nearly half a kilometer in diameter."
const blurb_7 = "JPL rates the tracked objects using the Palermo scale.  This logarithmic, relative scale compares the probabiliy impact against the background rate of impacts of a similar energy.<p>For example, a score of -2 means that an impactor is 1% as likely as any random event of similar destructive capability.<p>Note that Bennu is pretty high on the scale."
const blurb_8 = "Luckily, Bennu isnt due for a while.  There are a few close-calls coming up in this decade, though."
const blurb_9 = "All the objected are plotted here against their size and their velocity.<p>The larger either value, the more hazardous the object is.<p>Click \"Toggle\" to switch between the Palermo Scale or raw probability of impact, or \"Start Over\" to return to the beginning."

let SCENE = 0
let DATA = null
let CONTOUR_PALERMO = true

const PLOT_HEIGHT = 475
const PLOT_WIDTH = 700
const PLOT_MARGIN_X = 75
const PLOT_MARGIN_Y = 45
const LABEL_OFFSET = 35
const BAR_OFFSET = 10
const BAR_WIDTH = 20

const ASTER_COL = 10
const ASTER_SPACE = 35
const ASTER_START_RADIUS = 7.5

const SVG_TOTAL_HEIGHT = PLOT_MARGIN_Y+PLOT_HEIGHT+LABEL_OFFSET+BAR_OFFSET+BAR_WIDTH+25

const TEXT_X = "75%"
const TEXT_Y = "50%"

const BLURB_X = "600px"
const BLURB_Y = `${SVG_TOTAL_HEIGHT/2}px`
const BLURB_WIDTH = "400px"

const FINAL_BLURB_X = "600px"
const FINAL_BLURB_Y = `100px`

const T_TIME = 1000

// Div for tooltip
var tooltip = d3.select("body")
.append("div")
.style("position", "absolute")
.style("visibility", "hidden")
.style("background-color","white")
.style("opacity","0.85")

// Div for scene text
var title = d3.select("body")
.append("div")
.attr("id","blurb")
.style("position", "absolute")
.style("background-color","white")
.style("width",BLURB_WIDTH)
.style("left",BLURB_X)
.style("top",BLURB_Y)
.style("opacity","0")
.html("")

function parse_data(data) {
    clean=[]
    data.forEach(element => {
        console.log(element['Year Range'].split("-")[0])
        clean.push({
            "id":element['Object Designation'],
            "radius":parseFloat(0.5*element['Estimated Diameter (km)']),
            "palermo":parseFloat(element['Palermo Scale (cum.)']),
            "prob":parseFloat(element['Impact Probability (cumulative)']),
            "num_impact":parseInt(element['Potential Impacts']),
            "velocity":parseFloat(element['Vinfinity (km/s)']),
            "first_pass":parseInt(element['Year Range'].split("-")[0]),
        })
    });
    return clean
}

function get_min_max_field(clean,field){
    let max_rad = null
    let min_rad = null
    let this_rad = null
    clean.forEach(element => {
        this_rad = element[field]
        max_rad = (max_rad===null) ? this_rad : Math.max(max_rad,this_rad)
        min_rad = (min_rad===null) ? this_rad : Math.min(min_rad,this_rad)
    });
    return {"min":min_rad,"max":max_rad}
}

async function load_data() {
        raw_data = await d3.csv("cneos_sentry_summary_data_nan_filled.csv") //cneos_sentry_summary_data_nan_filled
        DATA = parse_data(raw_data)
}

function get_grid_coord(idx,ncol,spacing){
    num = idx
    col = num % ncol
    row = Math.floor(idx/ncol)
    return {'x':col*spacing,'y':row*spacing}
}

async function run_scene_zero(){

    // Read in data
    await load_data()
    console.log(DATA)

    // Show text
    d3.select("body").select("#blurb")
    .html(blurb_1)
    .style("left",BLURB_X)
    .style("top",BLURB_Y)
    .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
    .style("opacity",1)
    .on('end', ()=>{
        document.getElementById("next_button").disabled = false
    })
}

function run_scene_one(){

    // Disable button
    document.getElementById("next_button").disabled = true

    // Fade out and remove text, then animate rest
    d3.select("body").select("#blurb")
    .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
    .style("opacity",0)
    .on("end",()=>{

        // Add asteroids
        d3.select("svg").append('g')
        .selectAll('circle')
        .data(DATA)
        .enter().append('circle')
        .attr('r', ASTER_START_RADIUS)
        .attr('fill',"grey")
        .attr('cx',-100)
        .attr('cy',-100)
        .on('mouseenter', function (d, i) {
            d3.select(this).transition("mouse_enter")
                 .duration('50')
                 .attr('stroke', 'black')
                 .attr('stroke-width', '2')
            tooltip.style("top", (event.pageY)+"px").style("left",(event.pageX+10)+"px")
            tooltip.style("visibility", "visible")
            tooltip.html("Body: "+i.id)
        })   
        .on('mouseleave', function (d, i) {
            d3.select(this).transition("mouse_leave")
                 .duration('50')
                 .attr('stroke', 'none')
            tooltip.style("visibility", "hidden")
        })
        .on("click", function(d,i) {		
            tooltip.html("Body: "+i.id+
                "<br>Diameter: " + parseInt(2*1000*i.radius)+ " m" +
                "<br>Impact Prob: " + (100*i.prob).toFixed(3) + " %" +
                "<br>First Pass: " + i.first_pass + " AD" +
                "<br>Velocity: " + i.velocity + " km/sec" +
                "<br>Palemero:  " + i.palermo 
            )
        })
        .transition(d3.transition().duration(T_TIME).ease(d3.easeCubicOut))
        .delay(function(d, i) {
            return Math.random()*3*i;
            })
        .attr('cx',function(d,i){return PLOT_MARGIN_X+get_grid_coord(i,ASTER_COL,ASTER_SPACE)['x']})
        .attr('cy',function(d,i){return PLOT_MARGIN_Y+get_grid_coord(i,ASTER_COL,ASTER_SPACE)['y']})

        // Show text
        d3.select("body").select("#blurb")
        .html(blurb_2)
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .style("opacity",1)
        .on('end', ()=>{
            document.getElementById("next_button").disabled = false
        })
    })
}

function run_scene_two(){

    let rad_range = get_min_max_field(clean,"radius")
    let radius_scale = d3.scaleLog()
    .domain([rad_range.min, rad_range.max])
    .range([3, 20]);

    document.getElementById("next_button").disabled = true

    d3.select("body").select("#blurb")
    .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
    .style("opacity",0)
    .on("end",()=>{
        
        d3.select("svg").selectAll("circle")
        .transition(d3.transition().duration(T_TIME).ease(d3.easeCubicInOut))
        .attr("r",function(d,i){return radius_scale(d.radius)})
        .attr('cx',function(d,i){return PLOT_MARGIN_X+get_grid_coord(i,ASTER_COL,ASTER_SPACE)['x']})
        .attr('cy',function(d,i){return PLOT_MARGIN_Y+get_grid_coord(i,ASTER_COL,ASTER_SPACE)['y']})


        // Show text
        d3.select("body").select("#blurb")
        .html(blurb_3)
        .style("opacity",0)
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .style("opacity",1)
        .on('end', ()=>{
            document.getElementById("next_button").disabled = false
        })
    })

}

async function run_scene_three(min_size,max_size,pix_to_meters){

    let radius_scale = d3.scaleLinear()
    .domain([min_size, max_size])
    .range([min_size*pix_to_meters, max_size*pix_to_meters]);

    document.getElementById("next_button").disabled = true

    d3.select("body").select("#blurb")
    .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
    .style("opacity",0)
    .on("end",async ()=>{

        // Display text
        d3.select("body").select("#blurb")
        .html(blurb_4)
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .style("opacity",1)

        // Display tower for scale
        d3.select("svg")
        .append("g")
        .attr("transform", `translate(400,190)`)
        .append('image')
        .attr('xlink:href', './effiel.svg')
        .attr('height', 320*pix_to_meters)
        .attr('opacity',0)
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .attr('opacity',1)
        
        // Modify circles
        /*
        d3.selectAll("circle").filter(function(d) { return (d.radius*1000<min_size || d.radius*1000>max_size ); })
        .attr('opacity',1.0)
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .attr('opacity',.25)
        .on('end',()=>{

            d3.selectAll("circle")
            .transition(d3.transition().duration(T_TIME).ease(d3.easeCubicInOut))
            .attr("r",function(d,i){return radius_scale(1000*d.radius)})
            .on('end',()=>{
                document.getElementById("next_button").disabled = false
            })

        })
        */


        await d3.selectAll("circle").filter(function(d) { return (d.radius*1000<min_size || d.radius*1000>max_size ); })
        .attr('opacity',1.0)
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .attr('opacity',.25)
        .end()

        await d3.selectAll("circle")
        .transition(d3.transition().duration(T_TIME).ease(d3.easeCubicInOut))
        .attr("r",function(d,i){return radius_scale(1000*d.radius)})
        .end()

        document.getElementById("next_button").disabled = false

    })
}

async function run_scene_four(min_size,max_size, title){


    d3.select("body").select("#blurb")
    .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
    .style("opacity",0)
    .on("end",async ()=>{

        // Display text
        d3.select("body").select("#blurb")
        .html(title)
        .style("opacity",0)
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .style("opacity",1)

        // Transition all to translucent
        await d3.selectAll("circle")
        .attr('opacity',function(){
            let o = d3.select(this).attr("opacity"); 
            return ((o===null) ? 1 : o); 
        })
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .attr('opacity',0.25)
        .end()

        d3.selectAll("circle").filter(function(d) { return (d.radius*1000>min_size && d.radius*1000<max_size ); })
        .attr('opacity',.25)
        .transition(d3.transition()
            .duration(T_TIME)
            .ease(d3.easeLinear))
        .attr('opacity',1.0)

    })

}

function run_scene_six(){

    let rad_range = get_min_max_field(clean,"radius")
    let radius_scale = d3.scaleLog()
    .domain([rad_range.min, rad_range.max])
    .range([3, 20]);

    let pal_range = get_min_max_field(clean,"palermo")
    let palermo_scale = d3.scaleLinear()
    .domain([pal_range.min, pal_range.max])
    .range([0, 1]);

    document.getElementById("next_button").disabled = true

    d3.select("body").select("#blurb")
    .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
    .style("opacity",0)
    .on("end",()=>{

        d3.select("body").select("#blurb")
        .html(blurb_7)
        .style("opacity",0)
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .style("opacity",1)

        d3.select("svg").selectAll('circle')
        .transition(d3.transition().duration(T_TIME).ease(d3.easeCubicInOut))
        .attr("r",function(d,i){return radius_scale(d.radius)})
        .attr("opacity",1)
        .attr('fill', function(d){return d3.interpolateTurbo(palermo_scale(d.palermo))})  
        .on('end',()=>{
            document.getElementById("next_button").disabled = false
        })

        d3.select("svg").selectAll('image')
        .attr('opacity',1)
        .transition(d3.transition().duration(T_TIME/2).ease(d3.easeLinear))
        .attr('opacity',0)
        .on("end", ()=>{
            d3.select("svg").selectAll('image').remove()
        })

        let colorbar_x = PLOT_MARGIN_X-10
        let colorbar_y = PLOT_MARGIN_Y+PLOT_HEIGHT+LABEL_OFFSET+BAR_OFFSET
        let colorbar_len = (ASTER_COL-1)*ASTER_SPACE+20
        draw_colorbar(d3.select("svg").append("g").attr("id","colorbar"),colorbar_x,colorbar_y,25,colorbar_len,50,false,d3.interpolateTurbo,d3.scaleLinear,pal_range.min,pal_range.max)

    })
}

function run_scene_seven(){

    let yr_range = get_min_max_field(clean,"first_pass")

    document.getElementById("next_button").disabled = true

    d3.select("body").select("#blurb")
    .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
    .style("opacity",0)
    .on("end",()=>{

        d3.select("body").select("#blurb")
        .html(blurb_8)
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .style("opacity",1)
        draw_timeline(d3.select("svg"),50,50,400,7,75,20,2,2022,yr_range.max,20,"circle",T_TIME,()=>{
            document.getElementById("next_button").disabled = false
        })
    })


}

function run_scene_eight(){

    d3.select("body").select("#blurb")
    .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
    .style("opacity",0)
    .on("end",()=>{

        d3.select("body").select("#blurb")
        .html(blurb_9)
        .style("left",FINAL_BLURB_X)
        .style("top",FINAL_BLURB_Y)
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .style("opacity",1)


        range_prob = get_min_max_field(DATA,"prob")
        range_pal = get_min_max_field(DATA,"palermo")
        range_impacts = get_min_max_field(DATA,"num_impact")
        range_vel = get_min_max_field(DATA,"velocity")
        range_radius = get_min_max_field(DATA,"radius")
        let x = d3.scaleLog().domain([1,2*range_radius.max*1000]).range([0,PLOT_WIDTH])
        let y = d3.scaleLinear().domain([0,range_vel.max]).range([PLOT_HEIGHT,0])

        document.getElementById("next_button").disabled = true

        d3.select("svg")
        .selectAll("#timeline_root")
        .remove()

        // Move circles

        d3.selectAll("circle")
        .transition(d3.transition().duration(T_TIME).ease(d3.easeCubicInOut))
        .attr('cx',function(d,i){return PLOT_MARGIN_X+x(2*1000*d['radius'])})
        .attr('cy',function(d,i){return PLOT_MARGIN_Y+y(d['velocity'])})
        .on('end',()=>{
            document.getElementById("next_button").disabled = false
            document.getElementById("toggle_button").disabled = false
            document.getElementById("toggle_button").hidden = false;
            
        })

        d3.select("svg").append("g").attr("id","plot_elem")
        .attr("transform", `translate(${PLOT_MARGIN_X}, ${PLOT_MARGIN_Y})`)
        .call(d3.axisLeft(y))
        
        d3.select("svg").append("g").attr("id","plot_elem")
        .attr("transform", `translate(${PLOT_MARGIN_X}, ${PLOT_MARGIN_Y+PLOT_HEIGHT})`)
        .call(d3.axisBottom(x))

        d3.select("svg").append("g").attr("id","plot_elem")
        .append("text")
        .attr("x", PLOT_MARGIN_X+PLOT_WIDTH/2)
        .attr("y", PLOT_MARGIN_Y+PLOT_HEIGHT+LABEL_OFFSET)
        .text("Radius (meters)")

        d3.select("svg").append("g").attr("id","plot_elem")
        .append("text")
        .attr("transform",`translate(${PLOT_MARGIN_X - LABEL_OFFSET},${PLOT_MARGIN_Y+PLOT_HEIGHT/2})rotate(270)`)
        .text("Velocity (km/sec)")

        draw_colorbar_palermo()

        document.getElementById("next_button").innerHTML = "Start Over"

    })




 
}

function draw_colorbar_palermo() {

    let pal_range = get_min_max_field(clean,"palermo")

    d3.select("svg").selectAll('#colorbar').remove()
    draw_colorbar(d3.select("svg").append("g").attr("id","colorbar"),
        PLOT_MARGIN_X,
        PLOT_MARGIN_Y+PLOT_HEIGHT+LABEL_OFFSET+BAR_OFFSET,
        BAR_WIDTH,
        PLOT_WIDTH,
        100,
        false,
        d3.interpolateTurbo,
        d3.scaleLinear,
        pal_range.min,
        pal_range.max)

        d3.select("#colorbar_title").remove()
        d3.select("svg").append("g").attr("id","colorbar_title")
        .append("text")
        .attr("x", PLOT_MARGIN_X+PLOT_WIDTH/2)
        .attr("y", PLOT_MARGIN_Y+PLOT_HEIGHT+LABEL_OFFSET+BAR_OFFSET+BAR_WIDTH+LABEL_OFFSET)
        .text("Palermo Scale")
}

function draw_colorbar_prob(){

    let prob_range = get_min_max_field(clean,"prob")

    d3.select("svg").selectAll('#colorbar').remove()
    draw_colorbar(d3.select("svg").append("g").attr("id","colorbar"),
    PLOT_MARGIN_X,
    PLOT_MARGIN_Y+PLOT_HEIGHT+LABEL_OFFSET+BAR_OFFSET,
    BAR_WIDTH,
    PLOT_WIDTH,
    100,
    false,
    d3.interpolatePlasma,
    d3.scaleLinear,
    prob_range.min,
    prob_range.max)

    d3.select("#colorbar_title").remove()
    d3.select("svg").append("g").attr("id","colorbar_title")
    .append("text")
    .attr("x", PLOT_MARGIN_X+PLOT_WIDTH/2)
    .attr("y", PLOT_MARGIN_Y+PLOT_HEIGHT+LABEL_OFFSET+BAR_OFFSET+BAR_WIDTH+LABEL_OFFSET)
    .text("Probability of Impact")
}

function toggle_contour(){
    
    console.log("toggle...")

    CONTOUR_PALERMO = !CONTOUR_PALERMO
    document.getElementById("toggle_button").disabled = true

    if (CONTOUR_PALERMO){
        let pal_range = get_min_max_field(clean,"palermo")
        let palermo_scale = d3.scaleLinear()
        .domain([pal_range.min, pal_range.max])
        .range([0, 1]);
        d3.selectAll("circle")
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .attr('fill', function(d){return d3.interpolateTurbo(palermo_scale(d.palermo))})  

        draw_colorbar_palermo()

        document.getElementById("toggle_button").disabled = false

    } else{
        let prob_range = get_min_max_field(clean,"prob")
        let prob_scale = d3.scaleLog()
        .domain([prob_range.min, prob_range.max])
        .range([0, 1]);
        d3.selectAll("circle")
        .transition(d3.transition().duration(T_TIME).ease(d3.easeLinear))
        .attr('fill', function(d){return d3.interpolatePlasma(prob_scale(d.prob))})
        d3.select("svg").selectAll('#colorbar').remove()

        draw_colorbar_prob()

        document.getElementById("toggle_button").disabled = false

    }
}

function handle_click(){
    SCENE = SCENE + 1

    if(SCENE==1){
        console.log("scene 1")
        run_scene_one()
    } else if (SCENE==2){
        console.log("scene 2")
        run_scene_two()
    } else if (SCENE==3){
        console.log("scene 3")
        run_scene_three(0,10,1.00)
    } else if (SCENE==4){
        console.log("scene 4")
        run_scene_four(10,25,blurb_5)
    } else if (SCENE==5){
        console.log("scene 5")
        run_scene_four(25,9999,blurb_6)
    } else if (SCENE==6){
        console.log("scene 6")
        run_scene_six()
    } else if (SCENE==7){
        console.log("scene 6")
        run_scene_seven()
    } else if (SCENE==8){
        console.log("scene 6")
        run_scene_eight()
    } else {
        d3.select("svg").selectAll('*').remove()
        SCENE = 0
        document.getElementById("toggle_button").disabled = false
        document.getElementById("toggle_button").hidden = true;
        document.getElementById("next_button").innerHTML = "Next"
        run_scene_zero()
    }
}

run_scene_zero()

