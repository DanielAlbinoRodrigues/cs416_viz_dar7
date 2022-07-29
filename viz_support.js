
function draw_colorbar(svg,x,y,width,length,n_rect,vertical,color_function, scale,min,max){

    for (let i = 0; i < n_rect; i++) { 

        color_step = i*(1 / (n_rect-1))
    
        if(vertical){
            this_x = x
            this_y = i*(length/n_rect)+y
            this_width = width
            this_height = length/n_rect

        } else {
            this_x = i*(length/n_rect)+x
            this_y = y
            this_width = length/n_rect
            this_height = width
        }

        svg.append("rect")
        .attr('x', this_x)
        .attr('y', this_y)
        .attr('width', this_width)
        .attr('height', this_height)
        .attr('fill', color_function(color_step));
        
    }

    var axisScale = scale()
    .domain([min, max])
    .range([0, length]);

    var x_axis = d3.axisBottom(axisScale)

    svg.append("g")
        .attr("transform", `translate(${x},${y+1.05*width})`)
        .call(x_axis)

    
}

// svg is the selection to draw in
// X/Y is start corner
// length is length of each line (flat segment only)
// n_lines is number of timelines
// gap is space between lines
// line offset is the drop from the center of the circles to the line
function draw_timeline(svg,x,y,length,n_lines,gap,line_offset,stroke_width,tick_start,tick_end,tick_offset,marker_select,trans_time,callback){

    // Create group for timeline
    root = svg.append("g").attr("id","timeline_root")

    // Draw Line
    var path = d3.path();
    path.moveTo(0,0)
    for (let i = 0; i < n_lines; i++) {
        line_y = i*gap
        if (i%2 == 0){
            line_to_x = length
        }else {
            line_to_x = 0
        }
        arc_center_x = line_to_x
        arc_center_y = line_y+gap/2
        path.lineTo(line_to_x,line_y)
        if (i!=(n_lines-1)){
            path.arc(arc_center_x,arc_center_y,gap/2,3*3.14/2,3.14/2,(i%2!=0))
        } else (
            path.lineTo(line_to_x+gap/2,line_y)
        )
    }
    root.append("path").attr("d",path).attr("stroke","black").attr("stroke-width",stroke_width).attr("fill","none").attr("transform",`translate(${x},${y+line_offset})`)

    // Draw Labels
    step = (tick_end-tick_start)/n_lines
    labels = root.append("g").attr("id","ticks")

    for (let i = 0; i < n_lines+1; i++) {
        tick_val = tick_start + step*i
        if (i%2 == 0){
            tick_x = 0
        }else {
            tick_x = length
        }
        
        tick_y = i*gap
        if (i==n_lines){
            tick_y=tick_y-gap
        }
        labels.append("text").text(parseInt(tick_val)).attr("x",tick_x).attr("y",tick_y)

    }


    labels.append("text").text("2022")
    svg.select("#ticks").attr("transform",`translate(${x},${y+line_offset+tick_offset})`)

    // Send circles
    svg.selectAll(marker_select)
    .transition(d3.transition().duration(trans_time).ease(d3.easeCubicInOut))
    .attr('opacity',0.50)
    .attr("cx",function(d,i){
        band = get_band(tick_start,tick_end,n_lines,d['first_pass'])
        step = (tick_end-tick_start)/n_lines
        band_start = (band-1)*step+tick_start
        fraction = (d['first_pass'] - band_start) / step
        if(band%2==0){
            fraction = 1-fraction
        }
        return length*fraction+x

    })
    .attr("cy",function(d,i){
        band = get_band(tick_start,tick_end,n_lines,d['first_pass'])
        return (band-1)*gap+y
    })
    .on('end',callback)

    function get_band(min,max,n_lines,year){
        yr = year-min
        percentile = yr/(max-min)
        return Math.ceil(percentile / (1/n_lines))
    }

}
