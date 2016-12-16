// ==UserScript==
// @name           Memrise Infinite Learning
// @namespace      https://github.com/cooljingle
// @description    Causes items to continually be loaded during a learning session
// @match          http://www.memrise.com/course/*/garden/*
// @match          http://www.memrise.com/garden/review/*
// @version        0.0.4
// @updateURL      https://github.com/cooljingle/memrise-infinite-learning/raw/master/Memrise_Infinite_Learning.user.js
// @downloadURL    https://github.com/cooljingle/memrise-infinite-learning/raw/master/Memrise_Infinite_Learning.user.js
// @grant          none
// ==/UserScript==

$(document).ready(function() {
    var forceEnd = false;

    MEMRISE.garden.boxes.load = (function() {
        var cached_function = MEMRISE.garden.boxes.load;
        return function() {
            MEMRISE.garden.boxes.activate_box = (function() {
                var cached_function = MEMRISE.garden.boxes.activate_box;
                return function() {
                    var g = MEMRISE.garden,
                        self = this,
                        box = this._list[this.num];
                    if(box.template === "end_of_session" && !forceEnd) {
                        $.getJSON("http://www.memrise.com/ajax/session/", g.session_params, function(response){
                            if(response.success) {
                                //boxes
                                /*_.remove(g.boxes._list, function(b){return b.template === "end_of_session";}); //using alternate method below to avoid messing with existing scripts
                                g.boxes.load(response.boxes);*/
                                _.each(response.boxes, function(b){$.extend(b, {scheduled: true});});
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

                                $('#infinite-learning').text(function(i, n){return Number(n) + response.boxes.length;});
                            }
                            return cached_function.apply(self, arguments);
                        });
                    } else {
                        return cached_function.apply(self, arguments);
                    }
                };
            }());

            var result = cached_function.apply(this, arguments);

            MEMRISE.garden.session.setHeaderContent = (function() {
                var cached_function = MEMRISE.garden.session.setHeaderContent;
                return function() {
                    var result = cached_function.apply(this, arguments);
                    $('.js-course-details').html(function(i,v){return  v.replace(/(\d+)/, "<span id='infinite-learning' data-toggle='tooltip' data-placement='left' title='Go to end of session screen'>$1</span>");});
                    $('#infinite-learning')
                        .hover(function(){ $(this).css({'color': 'red', 'cursor':'pointer'}); }, function() { $(this).css('color', 'white'); } )
                        .click(function(){ forceEnd = true; MEMRISE.garden.boxes.num = MEMRISE.garden.boxes._list.length - 1; MEMRISE.garden.boxes.activate_box();});
                    return result;
                };
            }());

            return result;
        };
    }());
});
