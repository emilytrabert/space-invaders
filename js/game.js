(function() {
    var Game = {
        // organize random vars a bit better
        svg: document.getElementById('svg'),
        welcome: document.getElementById('screenWelcome'),
        restart: document.getElementById('screenGameover'),
        support: document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Shape", "1.1"),
        width: 500,
        height: 500,
        ns: 'http://www.w3.org/2000/svg',
        xlink: 'http://www.w3.org/1999/xlink',

        run: function() {
            this.svg.addEventListener('click', this.runGame, false);
        },

        init: function() {
            // Setup initial objects
            Hud.init();
            Shield.init();
            Ufo.init();
            Ship.init();

            if (!this.play) {
                this.play = window.setInterval(Game.update, 20);
            }
        },

        update: function() {
            Ship.update();
            Laser.update();
        },

        // Starts the game up after the user clicks start
        runGame: function() {
            // Update DOM
            Game.svg.removeEventListener('click', Game.runGame, false);
            Game.svg.removeChild(Game.welcome);

            // Fire controls and activate the game elements
            Ctrl.init();
            Game.init();
            var element = document.getElementById("body");
            element.classList.add("no-cursor");
        },

        endGame: function() {
            window.clearInterval(Ufo.timer);
            svg.style.display = 'none';
            var element = document.getElementById("body");
            element.classList.remove("no-cursor");
            document.getElementById("end").style.display = 'block';
        },

        elRemove: function(name) {
            // Loop through exploded string
            var items = name.split(' '), type, string, el;
            for (var i = items.length; i--;) {
                type = items[i].charAt(0);
                string = items[i].slice(1);

                // Set element based upon class or id
                el = (type === '.') ?
                    document.getElementsByClassName(string) :
                    document.getElementById(string);

                // Remove depending upon class or id
                if (type === '.') {
                    while(el[0])
                        el[0].parentNode.removeChild(el[0]);
                } else {
                    if (typeof el === 'object' && el !== null)
                        this.svg.removeChild(el);
                }
            }
        }
    };

    var Shield = {
        x: 64,
        y: 390,
        hp: 3,
        size: 15, // Piece size

        init: function() {
            // Create a shield array to store the pieces
            for (var block = 4; block--;) {
                for (var piece = 8; piece--;) {
                    this.build(block, piece);
                }
            }
        },

        // Designed to build individual shield pieces based upon their location in an array
        build: function(loc, piece) {
            var x = this.x + (loc * this.x) + (loc * (this.size * 3));

            var el = document.createElementNS(Game.ns, 'rect');
            el.setAttribute('x', this.locX(piece, x));
            el.setAttribute('y', this.locY(piece));
            el.setAttribute('class', 'shield active');
            el.setAttribute('hp', this.hp);
            el.setAttribute('width', this.size);
            el.setAttribute('height', this.size);
            Game.svg.appendChild(el);
        },

        // Determines a shields location based upon passed data
        locX: function(piece, x) {
            switch(piece) {
                case 0: return x;
                case 1: return x;
                case 2: return x;
                case 3: return x + this.size;
                case 4: return x + this.size;
                case 5: return x + (this.size * 2);
                case 6: return x + (this.size * 2);
                case 7: return x + (this.size * 2);
            }
        },
        // Only needs one param as y coordinate is the same across all piece sections
        locY: function(piece) {
            switch(piece) {
                case 0: return this.y;
                case 1: return this.y + this.size;
                case 2: return this.y + (this.size * 2);
                case 3: return this.y;
                case 4: return this.y + this.size;
                case 5: return this.y;
                case 6: return this.y + this.size;
                case 7: return this.y + (this.size * 2);
            }
        },

        // Accepts a passed shield element and modifies its health
        collide: function(el) {
            // Get and modify the hp attribute
            var hp = parseInt(el.getAttribute('hp'), 10) - 1;

            // Determine what to do based upon the current HP
            switch(hp) {
                case 1: var opacity = 0.33; break;
                case 2: var opacity = 0.66; break;
                default: return Game.svg.removeChild(el); // Exits this function early
            }

            // Adjust attributes if the element wasn't deleted
            el.setAttribute('hp', hp);
            el.setAttribute('fill-opacity', opacity);
        }
    };

    var Laser = {
        speed: 8,
        width: 2,
        height: 10,

        build: function(x, y, negative) {
            var el = document.createElementNS(Game.ns,'rect');

            // Determine laser direction
            if (negative) {
                el.setAttribute('class', 'laser negative');
            } else {
                el.setAttribute('class', 'laser');
            }

            el.setAttribute('x', x);
            el.setAttribute('y', y);
            el.setAttribute('width', this.width);
            el.setAttribute('height', this.height);
            Game.svg.appendChild(el);
        },

        update: function() {
            var lasers = document.getElementsByClassName('laser');

            if (lasers.length) {
                // Get all active items
                var active = document.getElementsByClassName('active');

                // Keep vars out of the loop
                var laserX, laserY, cur, num, activeClass, activeX, activeY, activeW, activeH;

                for (cur = lasers.length; cur--;) {
                    // collect vars for current laser object
                    laserX = parseInt(lasers[cur].getAttribute('x'), 10);
                    laserY = parseInt(lasers[cur].getAttribute('y'), 10);

                    // Remove laser if its out of bounds
                    if (laserY < 0 || laserY > Game.height) {
                        this.collide(lasers[cur]);
                        continue;
                    // Otherwise move it on the cartesian graph and update the y coordinate
                    } else {
                        laserY = this.direction(laserY, lasers[cur].getAttribute('class'));
                        lasers[cur].setAttribute('y', laserY);
                    }

                    // Check against active elements
                    for (num = active.length; num--;) {
                        if (active[num] === undefined) return; // Force exit in-case gameover fires while loop is running

                        // Get active element properties
                        activeX = parseInt(active[num].getAttribute('x'), 10) || Ship.x;
                        activeY = parseInt(active[num].getAttribute('y'), 10) || Ship.y;
                        activeW = parseInt(active[num].getAttribute('width'), 10) || Ship.width;
                        activeH = parseInt(active[num].getAttribute('height'), 10) || Ship.height;

                        // Laser and active element collision test
                        if (laserX + this.width >= activeX &&
                            laserX <= (activeX + activeW) &&
                            laserY + this.height >= activeY &&
                            laserY <= (activeY + activeH)) {

                            // Remove laser
                            this.collide(lasers[cur]);

                            // Use active's class to determine what was hit
                            activeClass = active[num].getAttribute('class');
                            if (activeClass === 'ufo active') { // regular minion
                                Ufo.collide(active[num]);
                            } else if (activeClass === 'shield active') { // shield
                                Shield.collide(active[num]);
                            } else if (Ship.player[0]) { // Ship
                                Ship.collide();
                            }
                        }
                    }
                }
            }
        },

        direction: function(y, laserClass) {
            var speed = laserClass === 'laser negative' ? -this.speed : this.speed;
            return y += speed;
        },

        collide: function(laser) {
            if (laser !== undefined) Game.svg.removeChild(laser);
        }
    };

    var Ship = {
        width: 35,
        height: 12,
        speed: 3,
        // path only contains the shape, not the x and y inendation (limitation of SVG paths)
        path: 'm 0 15 l 9 5 h 17 l 9 -5 l -2 -5 l -10 3 l -6 -15 l -6 15 l -10 -3 l -2 5',
        

        init: function() {
            // Change player x and y to the default
            this.x = 220;
            this.y = 460;

            // Create the main player
            this.build(this.x, this.y, 'player active');
        },

        // We need to make the build function take parameters so its re-usable to draw lives
        build: function(x, y , shipClass) {
            var el = document.createElementNS(Game.ns,'path');

            var pathNew = 'M' + x + ' ' + (y + 8) + this.path;

            el.setAttribute('class', shipClass);
            el.setAttribute('d', pathNew);
            Game.svg.appendChild(el);

            // Store the player in memory for easy reference
            this.player = document.getElementsByClassName('player');
        },

        update: function() {
            // Move the ship if keyboard input is detected and the ship is against the container walls
            if (Ctrl.left && this.x >= 0) {
                this.x -= this.speed;
            } else if (Ctrl.right && this.x <= (Game.width - this.width)) {
                this.x += this.speed;
            }

            // Create a new path to implement the movement
            var pathNew = 'M' + this.x + ' ' + (this.y + 8) + this.path;
            // Doulbe check the player exists before trying to update it
            if (this.player[0]) this.player[0].setAttribute('d', pathNew);
        },

        collide: function() {
            Hud.lives -= 1;

            Game.svg.removeChild(this.player[0]);
            Game.svg.removeChild(this.lives[Hud.lives]);

            if (Hud.lives > 0) {
                // Recreates the player with a delay timer
                window.setTimeout(function() {
                    Ship.build(Ship.x, Ship.y, 'player active');
                }, 1000);
            } else {
                return Game.endGame();
            }
        }
    };

    var Ufo = {
        width: 25,
        height: 19,
        x: 64,
        y: 90,
        gap: 10,
        row: 5,
        col: 11,

        // ufo paths retrieved from Inkscape or Illustrator via SVG save
        pathA: 'M22.923,10.359V8.45h-3.819V6.539h-1.91V4.725l1.91-0.096v-1.91h-1.91l-0.084,1.91h-1.827v1.91h-5.73v-1.91H7.745l-0.104-1.91h-1.91v1.91l1.911,0.095v1.815h-1.91V8.45H1.911v1.909H0v5.732h1.91V12.27h1.91v3.82h1.911V18h1.91h3.82v-1.91h-3.82v-1.91h1.91h5.73h1.91v1.91h-3.82V18h5.73v-1.91h1.91v-1.91v-1.91h1.91v3.82h1.911v-3.82v-1.91H22.923z M9.552,10.359h-1.91V8.45h1.91V10.359z M17.193,10.359h-1.911V8.45h1.911V10.359z',
        pathB: 'M22.923,6.537v3.821h-1.909V8.448h-1.91V6.537h-1.91V4.716l1.91-0.088V2.717h-1.91l-0.065,1.911h-1.845v1.91H9.552v-1.91H7.73L7.642,2.717H5.731v1.911l1.911,0.087v1.823H5.731v1.911h-1.91v1.911h-1.91V6.537H0v3.821v3.821h1.911v1.91H0.035V18h1.91v-1.911h1.841v-1.91h3.855v1.91h1.91v-1.91h5.73v1.91h1.91v-1.91h3.821v1.91h1.849L22.923,18h1.911v-1.911l-1.911-0.071v-1.839h1.911v-3.821V6.537H22.923z M9.552,10.358h-1.91V8.448h1.91V10.358z M17.193,10.358h-1.911V8.448h1.911V10.358z',
        
        init: function() {
            // Reset necessary values
            this.speed = 10;
            this.counter = 0;

            // Create ufos
            this.build();

            // ufos run on their own separate time gauge
            this.delay = 800 - (20 * Hud.level);

            if (this.timer)
                window.clearInterval(Ufo.timer);

            this.timer = window.setInterval(this.update, this.delay);
        },

        build: function() {
            // Create group for storing ufo array output
            var group = document.createElementNS(Game.ns, 'g');
            group.setAttribute('class', 'open');
            group.setAttribute('id', 'flock');

            // Loop through ufo array data you just created
            var col, el, imageA, imageB;
            for (var row = this.row; row--;) {
                for (col = this.col; col--;) {
                    // Setup the ufo's output
                    el = document.createElementNS(Game.ns, 'svg');
                    el.setAttribute('x', this.locX(col));
                    el.setAttribute('y', this.locY(row));
                    el.setAttribute('class', 'ufo active');
                    el.setAttribute('row', row);
                    el.setAttribute('col', col);
                    el.setAttribute('width', this.width);
                    el.setAttribute('height', this.height);
                    el.setAttribute('viewBox', '0 0 25 19'); // Controls viewport of individual ufo

                    imageA = document.createElementNS(Game.ns, 'path');
                    imageB = document.createElementNS(Game.ns, 'path');
                    imageA.setAttribute('d', this.pathA);
                    imageB.setAttribute('d', this.pathB);
                    imageA.setAttribute('class','anim1 ' + this.type(row));
                    imageB.setAttribute('class','anim2 ' + this.type(row));
                    el.appendChild(imageA);
                    el.appendChild(imageB);

                    group.appendChild(el);
                }
            }

            // Add the created ufo flock to the DOM
            Game.svg.appendChild(group);

            // Store the ufo flock for manipulation later
            this.flock = document.getElementById('flock');
        },

        type: function(row) {
            switch(row) {
                case 0: return 'a';
                case 1: return 'b';
                case 2: return 'b';
                case 3: return 'c';
                case 4: return 'c';
            }
        },

        locX: function(col) {
            return this.x + (col * this.width) + (col * this.gap);
        },

        locY: function(row) {
            return this.y + (row * this.height) + (row * this.gap);
        },

        update: function() {
            var invs = document.getElementsByClassName('ufo');

            if (invs.length === 0) return;

            // Get the current flock data and set variables as necesasry
            var flockData = Ufo.flock.getBBox(),
            flockWidth = Math.round(flockData.width),
            flockHeight = Math.round(flockData.height),
            flockX = Math.round(flockData.x),
            flockY = Math.round(flockData.y),
            moveX = 0,
            moveY = 0;

            // Decide direction based upon current Ufo flock position
            if (flockWidth + flockX + Ufo.speed >= Game.width ||
                flockX + Ufo.speed <= 0) {
                moveY = Math.abs(Ufo.speed);
                Ufo.speed = Ufo.speed * -1; // reverse speed
            } else {
                moveX = Ufo.speed;
            }

            // Update all UFOs
            var newX, newY;
            for (var i = invs.length; i--;) {
                newX = parseInt(invs[i].getAttribute('x'), 10) + moveX;
                newY = parseInt(invs[i].getAttribute('y'), 10) + moveY;

                invs[i].setAttribute('x', newX);
                invs[i].setAttribute('y', newY);
            }

            // Return immediately if UFOs have pushed too far
            if (flockY + flockHeight >= Shield.y) {
                return Game.endGame(); // Exit everything and shut down the game
            }

            Ufo.animate();
            Ufo.shoot(invs, flockY + flockHeight - Ufo.height);
        },

        animate: function() {
            if (this.flock.getAttribute('class') === 'open') {
                this.flock.setAttribute('class','closed');
            } else {
                this.flock.setAttribute('class','open');
            }
        },

        shoot: function(invs, lastRowY) {
            // Test a random number to see if the ufos fire
            if (Math.floor(Math.random() * 5) !== 1) return;

            // Get invaders only from the last row
            var stack = [], currentY;
            for (var i = invs.length; i--;) {
                currentY = parseInt(invs[i].getAttribute('y'), 10);
                if (currentY >= lastRowY)
                    stack.push(invs[i]);
            }

            // Choose a random invader from the stack and shoot from it
            var invRandom = Math.floor(Math.random() * stack.length);
            Laser.build(parseInt(stack[invRandom].getAttribute('x'), 10) + (this.width / 2), lastRowY + this.height + 10, false);
        },

        collide: function(el) {
            Hud.updateScore(1);
            Hud.levelUp();
            el.parentNode.removeChild(el);
        }
    };

    var Hud = {
        livesX: 360,
        livesY: 10,
        livesGap: 10,
        init: function() {
            this.score = 0;
            this.bonus = 0;
            this.lives = 3;
            this.level = 1;

            // Create life counter
            var x;
            for (var life = 0; life < Hud.lives; life++) {
                x = this.livesX + (Ship.width * life) + (this.livesGap * life);
                Ship.build(x, this.livesY, 'life');
            }

            // Text creation
            this.build('Lives:', 310, 30, 'textLives');
            this.build('Score: 0', 20, 30, 'textScore');

            // Store lives
            Ship.lives = document.getElementsByClassName('life');
        },

        // Creates text output
        build: function(text, x, y, classText) {
            var el = document.createElementNS(Game.ns, 'text');
            el.setAttribute('x', x);
            el.setAttribute('y', y);
            el.setAttribute('id', classText);
            el.appendChild(document.createTextNode(text));
            Game.svg.appendChild(el);
        },

        updateScore: function(pts) {
            // Update scores
            this.score += pts;
            this.bonus += pts;

            // Inject new score text
            var el = document.getElementById('textScore');
            el.replaceChild(document.createTextNode('Score: ' + this.score), el.firstChild);
        },

        levelUp: function() {
            // count ufo kills
            Ufo.counter += 1;
            var invTotal = Ufo.col * Ufo.row;

            // Test to level
            if (Ufo.counter === invTotal) {
                this.level += 1;
                Ufo.counter = 0;

                window.clearInterval(Ufo.timer);
                Game.svg.removeChild(Ufo.flock);

                // Wait a brief moment to spawn next wave
                setTimeout(function() {
                    Ufo.init();
                }, 300);

            } else if (Ufo.counter === Math.round(invTotal / 2)) { // Increase ufo speed
                Ufo.delay -= 250;

                window.clearInterval(Ufo.timer);
                Ufo.timer = window.setInterval(Ufo.update, Ufo.delay);
            } else if (Ufo.counter === (Ufo.col * Ufo.row) - 3) {
                Ufo.delay -= 300;

                window.clearInterval(Ufo.timer);
                Ufo.timer = window.setInterval(Ufo.update, Ufo.delay);
            }
        }
    };

    var Ctrl = {
        init: function() {
            window.addEventListener('keydown', this.keyDown, true);
            window.addEventListener('keyup', this.keyUp, true);
            window.addEventListener('mousemove', this.mouse, true);
            window.addEventListener('click', this.click, true);
        },

        keyDown: function(event) {
            switch(event.keyCode) {
                case 32: // spacebar, shoot
                    var laser = document.getElementsByClassName('negative');
                    var player = document.getElementsByClassName('player');
                    if (!laser.length && player.length)
                        Laser.build(Ship.x + (Ship.width / 2) - Laser.width, Ship.y - Laser.height, true);
                    break;
                case 39: // left
                    Ctrl.right = true;
                    break;
                case 37: // right
                    Ctrl.left = true;
                    break;
                case 81: // q, shortcut to quit
                    Game.endGame();
                    break;
                default:
                    break;
            }
        },

        keyUp: function(event) {
            switch(event.keyCode) {
                case 39: // Left
                    Ctrl.right = false;
                    break;
                case 37: // Right
                    Ctrl.left = false;
                    break;
                default:
                    break;
            }
        },

        mouse: function(event) {
            var mouseX = event.pageX;
            var xNew = mouseX - Ship.xPrev + Ship.x;

            if (xNew > 0 && xNew < Game.width - Ship.width) {
                Ship.x = xNew;
            }

            Ship.xPrev = mouseX;
        },

        click: function(event) {
            var laser = document.getElementsByClassName('negative');
            var player = document.getElementsByClassName('player');

            if (event.button === 0 &&
                player.length &&
                !laser.length)
                Laser.build(Ship.x + (Ship.width / 2) - Laser.width, Ship.y - Laser.height, true);
        }
    };

    window.onload = function() {
        Game.run();
    };
}());