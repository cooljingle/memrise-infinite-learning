// ==UserScript==
// @name           Memrise Infinite Learning
// @namespace      https://github.com/cooljingle
// @description    Causes items to continually be loaded during a learning session
// @match          https://www.memrise.com/course/*/garden/*
// @match          https://www.memrise.com/garden/review/*
// @version        0.0.10
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
                        $.getJSON("https://www.memrise.com/ajax/session/", g.session_params)
                            .done(function( response ) {
                            if(response.session && response.session.slug !== "practise") {
                                //boxes
                                _.each(response.boxes, function(b){$.extend(b, {scheduled: true});});
                                Array.prototype.splice.apply(g.boxes._list, [g.boxes._list.length -1 , 0].concat(response.boxes));
                                //learnables
                                _.each(response.learnables, l => g.learnables[l.learnable_id] = l);
                                if(g.populateLearnables)
                                    g.populateLearnables();
                                //things_to_courses
                                $.extend(g.things_to_courses, response.things_to_courses);
                                //thingusers
                                g.thingusers.load(response.thingusers);

                                $('#infinite-learning').text(Object.keys(g.learnables).length);
                            }
                            return cached_function.apply(self, arguments);
                        })
                            .fail(function( jqxhr, textStatus, error ) {
                            var err = textStatus + ", " + error;
                            console.log( "Request Failed: " + err );
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
