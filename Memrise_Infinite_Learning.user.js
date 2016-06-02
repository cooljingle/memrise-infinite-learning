// ==UserScript==
// @name           Memrise Infinite Learning
// @namespace      https://github.com/cooljingle
// @description    Causes items to continually be loaded during a learning session
// @match          http://www.memrise.com/course/*/garden/*
// @match          http://www.memrise.com/garden/review/*
// @version        0.0.1
// @updateURL      https://github.com/cooljingle/memrise-infinte-learning/raw/master/Memrise_Infinite_Learning.user.js
// @downloadURL    https://github.com/cooljingle/memrise-infinte-learning/raw/master/Memrise_Infinite_Learning.user.js
// @grant          none
// ==/UserScript==

MEMRISE.garden.boxes.load = (function() {
    var cached_function = MEMRISE.garden.boxes.load;
    return function() {
        _.each(MEMRISE.garden.box_types, function(box_type) {
            box_type.prototype.activate = (function() {
                var cached_function = box_type.prototype.activate;
                return function() {
                    var g = MEMRISE.garden,
                        self = this;
                    if(g.boxes.num + 2 === g.boxes._list.length) { //box before end_of_session
                        $.getJSON("http://www.memrise.com/ajax/session/", g.session_params, function(response){
                            if(response.success) {
                                //boxes
                                _.remove(response.boxes, function(b){return b.thing_id === self.thing_id;}); //stop current thing coming up a second time
                                /*_.remove(g.boxes._list, function(b){return b.template === "end_of_session";}); //using alternate method below to avoid messing with existing scripts
                                g.boxes.load(response.boxes);*/
                                Array.prototype.splice.apply(g.boxes._list, [g.boxes._list.length -1 , 0].concat(response.boxes));
                                //mems
                                g.mems.load(response.mems);
                                //pools
                                $.extend(g.pools, response.pools);
                                //things
                                $.extend(g.things, response.things);
                                //thinguser_course_ids
                                $.extend(g.thinguser_course_ids, response.thinguser_course_ids);
                                //thingusers
                                g.thingusers.load(response.thingusers);
                            }
                            return cached_function.apply(self, arguments);
                        });
                    } else {
                            return cached_function.apply(self, arguments);
                    }
                };
            }());
        });

        MEMRISE.garden.session.setHeaderContent = (function() {
                var cached_function = MEMRISE.garden.session.setHeaderContent;
                return function() {
                    var result = cached_function.apply(this, arguments);
                    $('.js-course-details').html(function(i,v){console.log(v); return  v.replace(/\d+/, "<span id='infinite-learning' data-toggle='tooltip' data-placement='left' title='Go to end of session screen'>" + "∞" + "</span>");});
                    $('#infinite-learning')
                        .hover(function(){ $(this).css({'color': 'red', 'cursor':'pointer'}); }, function() { $(this).css('color', 'white'); } )
                        .click(function(){ MEMRISE.garden.boxes.num = MEMRISE.garden.boxes._list.length - 1; MEMRISE.garden.boxes.activate_box();});
                    return result;
                };
            }());
        return cached_function.apply(this, arguments);
    };
}());
