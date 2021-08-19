window.onload = () => {
    let calculateTab = document.querySelector("#calculate-tab");
    let sourceDropdown = document.querySelector('.source-dropdown');
    let destDropdown = document.querySelector('.destination-dropdown');
    let calculateBtn = document.querySelector('.calculate-btn');
    let resultp = document.querySelector('.result-card > .card-body > .result-data');
    let previousResults = document.querySelector(".prev-results");
    let covidResuts = document.querySelector(".cov-results");
    let getStartedBtn = document.querySelector('.get-started-btn');
    let checkBtn = document.querySelector(".check-btn");
    let resultLocations = [];
    let currentFlag = false;

    let getLocation = async () => {
        let response = await fetch('./assets/city_list.json');
        let parsedJSON = await response.json();
        return parsedJSON.cities;
    }

    let getConnection = async () => {
        let response = await fetch('./assets/node_connection.json');
        let parsedJSON = await response.json();
        return parsedJSON.connection;
    }

    let getCovidData = async () => {
        let response = await fetch('https://data.covid19india.org/v4/min/data.min.json');
        let parsedJSON = await response.json();
        return parsedJSON;
    }

    let getNameList = (locations, graph, sourceDropdown, destDropdown) => {
        locations.forEach((item) => {
            // Add vertices to graph
            graph.addVertex(item.location, item.latitude, item.longitude, item.code);
            // Add all location in source location dropdown list
            let option = document.createElement('option');
            option.innerHTML = item.location;
            sourceDropdown.appendChild(option).setAttribute('value',item.location);
            // Add all location in destination location dropdown list
            option = document.createElement('option');
            option.innerHTML = item.location;
            destDropdown.appendChild(option).setAttribute('value',item.location);
        });

    };

    let timeIntoMinutes = (timeData) => {
        let convertedTime = timeData.split(':');
        let updatedTime = parseInt(convertedTime[0]) * 60 + parseInt(convertedTime[1]);
        return updatedTime;
    }

    let addPath = (graph, selectedNodes, mymap) => {
        for(let i = 0; i < selectedNodes.length - 1; i++) {
            let sourceCoords = graph.getCoordsOfLocation(selectedNodes[i], 'coords');
            let destCoords = graph.getCoordsOfLocation(selectedNodes[i+1], 'coords');
            let polyline = L.polyline([sourceCoords, destCoords], {color: '#FFD700'}).addTo(mymap);
         }
    }

    let removePath = (graph, selectedNodes, mymap) => {
        for(let i = 0; i < selectedNodes.length - 1; i++) {
            let sourceCoords = graph.getCoordsOfLocation(selectedNodes[i], 'coords');
            let destCoords = graph.getCoordsOfLocation(selectedNodes[i+1], 'coords');
            let polyline = L.polyline([sourceCoords, destCoords], {color: '#005A9C'}).addTo(mymap);
        }
    }

    let blockOfCode1 = (key, source, destination, distance) => {
        return `<div class="row" style="width: 100%;">
            <div class="col-6 col-md-3">
                <div class="alert alert-primary d-flex align-items-center justify-content-center" role="alert">
                    <span class="material-icons"> room </span>
                    <div class="ps-2"> ${source} </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="alert alert-primary d-flex align-items-center justify-content-center" role="alert">
                    <span class="material-icons"> room </span>
                    <div class="ps-2"> ${destination} </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="alert alert-primary d-flex align-items-center justify-content-center" role="alert">
                    <span class="material-icons"> social_distance </span>
                    <div class="ps-2"> ${distance} km </div>
                </div>
            </div>
            <div class="col-6 col-md-3 mt-3">
                <button type="button" id="${key}" class="btn check-btn btn-primary d-flex justify-content-center align-items-center w-100"><span class="pe-2"> Check </span> <span class="material-icons"> east </span> </button>
            </div>
        </div>`;
    }

    let updateRecentSearch = (graph, selectedNodes) => {
        previousResults.innerHTML = '';
        let resultCode = '';
        for(let i in selectedNodes) {
            resultCode += blockOfCode1( selectedNodes[i].data.key, selectedNodes[i].data.source, selectedNodes[i].data.destination, selectedNodes[i].data.distance);
        }
        previousResults.innerHTML = resultCode;
    }

    let blockOfCode2 = (destLocation, confirmed, recovered) => {
        return `<div class="row covid-resuts">
            <div class="col-md-8 col-12 d-flex justify-content-center flex-column ps-md-4">
                <div class="row">
                    <div class="col-md-4 offset-md-1 text-start"> <strong>Location:</strong> </div>
                    <div class="col-md-7 text-start"> ${destLocation} </div>
                </div>
                <div class="row">
                    <div class="col-md-4 offset-md-1 text-start"> <strong>Cases Registered:</strong> </div>
                    <div class="col-md-7 text-start"> ${confirmed} </div>
                </div>
                <div class="row">
                    <div class="col-md-4 offset-md-1 text-start"> <strong>People Recovered:</strong> </div>
                    <div class="col-md-7 text-start"> ${recovered} </div>
                </div>
                <div class="row">
                    <div class="col-md-4 offset-md-1 text-start"> <strong>Lockdown:</strong> </div>
                    <div class="col-md-7 text-start"> Yes </div>
                </div>
                <div class="row">
                    <div class="col-md-4 offset-md-1 text-start"> <strong>Rules:</strong> </div>
                        <div class="col-md-7 text-start">
                            <ol>
                                <li> Mask Compulsory </li>
                                <li> Shops open between 7 A.M. to 5 P.M. </li>
                                <li> Unnecesary roaming not allowed </li>
                            </ol>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-12">
                    <div class="d-flex justify-content-center align-items-center">
                        <span class="material-icons"style="font-size: 150px; color: #3f3d56;"> coronavirus </span>
                    </div>
                </div>
            </div>`;
    }

    let updateCOVIDStats = (graph, destLocation, COVIDData) => {
        covidResuts.innerHTML = '';
        let resultCode = '';
        let destIndex = graph.getCoordsOfLocation(destLocation, 'index');
        let code = graph.getCodeName(destIndex);
        let confirmed, recovered;
        try {
            confirmed = COVIDData[code]['districts'][destLocation]['delta7']['confirmed'];
            recovered = COVIDData[code]['districts'][destLocation]['delta7']['recovered'];
        } catch(err) {
            confirmed = '-';
            recovered = '-';
        }
        if(confirmed == undefined) {
            confirmed = '-';
        }
        if(recovered == undefined) {
            recovered = '-';
        }
        resultCode += blockOfCode2(destLocation, confirmed, recovered);
        covidResuts.innerHTML = resultCode;
    }

    class Node {
        // Constructor method
        constructor(key, data) {
            this.key = key;
            this.data = data;
            this.prev = null;
            this.next = null;
        }
    }

    class DoublyLinkedList {
        // Constructor method
        constructor(capacity) {
            this.capacity = capacity;
            this.head = null;
            this.tail = null;
            this.current = -1;
            this.size = 0;
            this.cacheMap = {};
        }
        // Class methods
        addNode(key, value) {
            let newNode;
            if(this.cacheMap[key] === undefined) {
                newNode = new Node(key, value);
            }
            if(this.size == 0) {
                this.head = newNode;
                this.tail = newNode;
                this.size++;
                this.cacheMap[key] = newNode;
                return this;
            }
            if(this.size == this.capacity) {
                delete this.cacheMap[this.tail.key];

                this.tail = this.tail.prev;
                this.tail.next = null;
                this.size--;
            }
            this.head.prev = newNode;
            newNode.next = this.head;
            this.head = newNode;
            this.size++;
            this.cacheMap[key] = newNode;

            this.current = 0;
            currentFlag = false;
            return this;
        }
        findNode(key, reverse) {
            if(key in this.cacheMap) {
            } else if(reverse in this.cacheMap) {
                key = reverse;
            }

            if(this.cacheMap[key] === undefined) {
                return undefined;
            }
            let nodeToFind = this.cacheMap[key];
            if(nodeToFind == this.head) {
                return nodeToFind;
            }
            let previousNode = nodeToFind.prev;
            let nextNode = nodeToFind.next;

            if(nodeToFind == this.tail) {
                previousNode.next = null;
                this.tail = previousNode;
            } else {
                previousNode.next = nextNode;
                nextNode.prev = previousNode;
            }
            this.head.prev = nodeToFind;
            nodeToFind.prev = null;
            nodeToFind.next = this.head;
            this.head = nodeToFind;

            return nodeToFind;
        }
        getRecentSearch() {
            let arr = [];
            let current = this.head;
            while(current != null) {
                arr.push(current);
                current = current.next;
            }
            return arr;
        }
        getNextSearch() {
            if(!this.head) {
                return 2;
            } else if(this.current == 0) {
                return 0;
            } else {
                this.current--;
                return 1;
            }
        }
        getPrevSearch() {
            if(!this.head) {
                return 2;
            } else if(this.current+1 >= this.capacity-1) {
                return 0;
            } else {
                this.current++;
                return 1;
            }
        }
    }

    class Graph {
        // Constructor method
        constructor() {
            this.vertices = [];
            this.coords = [];
            this.stateCodes = [];
            this.numberofVertices = 0;
            this.edges = [];
            this.numberofEdges = 0;
            this.selectedNodes = [];
            this.totalDistance = 0;
            this.totalTime = 0;
        }
        // Class methods
        addVertex(vertex, latitude, longitude, code) {
            this.vertices.push(vertex);
            this.coords.push([latitude, longitude]);
            this.stateCodes.push(code);
            this.numberofVertices++;
            this.edges[vertex] = [];
        }
        addEdges(vertex1, vertex2, distance, time) {
            this.edges[vertex1].push([vertex2, parseInt(distance), parseInt(time)]);
            this.edges[vertex2].push([vertex1, parseInt(distance), parseInt(time)]);
            this.numberofEdges++;
        }
        getNumberOfVertices() {
            return this.numberofVertices;
        }
        getCoordsOfLocation(location, status) {
            let index;
            let low = 0;
            let high = this.numberofVertices;
            while(low<=high) {
                let mid = Math.ceil((low+high)/2);
                if(this.vertices[mid]==location) {
                    if(status=='coords') {
                        return this.coords[mid];
                    } else if(status=='index') {
                        return mid;
                    }
                } else if(this.vertices[mid] < location) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            return -1;
        }
        getSelectedNodes() {
            return this.selectedNodes;
        }
        getCodeName(index) {
            return this.stateCodes[index];
        }
        getTopPriorityElement(notVisited, visited) {
            let minNode = null;
            let minDistance = Infinity;
            for(let i in notVisited) {
                if(notVisited[i][0] < minDistance && !visited.includes(i)) {
                    minDistance = notVisited[i][0];
                    minNode = i;
                }
            }
            return minNode;
        }
        dijkstraShortestPath(sourceLocation, destLocation, mymap) {
            // Remove the previously selected highlighted path
            removePath(this, this.selectedNodes, mymap);

            // Clear previous result data
            this.selectedNodes = [];
            this.totalDistance = 0;
            this.totalTime = 0;

            let INF = Infinity;
            let notVisited = [];
            let parentNodes = [];
            let visited = [];
            for(let i = 0; i < this.numberofVertices; i++) {
                notVisited[this.vertices[i]] = (this.vertices[i]==sourceLocation) ? [0, 0] : [INF, INF];
                parentNodes[this.vertices[i]] = null;
            }

            let currentNode = this.getTopPriorityElement(notVisited, visited);
            while(currentNode!=destLocation) {
                let distance = notVisited[currentNode][0];
                let time = notVisited[currentNode][1];
                let neighbourNodes = this.edges[currentNode];
                for(let node in neighbourNodes) {
                    let updatedDistance = distance + neighbourNodes[node][1];
                    let updatedTime = time + neighbourNodes[node][2];
                    if(updatedDistance < notVisited[neighbourNodes[node][0]][0]) {
                        notVisited[neighbourNodes[node][0]][0] = updatedDistance;
                        notVisited[neighbourNodes[node][0]][1] = updatedTime;
                        parentNodes[neighbourNodes[node][0]] = currentNode;
                    }
                }
                visited.push(currentNode);
                currentNode = this.getTopPriorityElement(notVisited, visited);
            }

            let tempNode = parentNodes[destLocation];
            this.selectedNodes.push(destLocation);
            while(tempNode!=null) {
                this.selectedNodes.push(tempNode);
                tempNode = parentNodes[tempNode];
            }
            this.selectedNodes.reverse();
            this.totalDistance = notVisited[destLocation][0];
            this.totalTime= notVisited[destLocation][1];

            // Highlight the path on the leaflet map
            addPath(this, this.selectedNodes, mymap);
        }
        getTimeInTimeFormat() {
            let hours = parseInt(this.totalTime / 24);
            let minutes = parseInt(this.totalTime % hours);
            let result = String(hours) + ' hours and ' + String(minutes) + ' minutes';
            return result;
        }
    };


    (async function main() {
        let graph = new Graph();
        let lruCache = new DoublyLinkedList(4);
        // Create and initialize the map
        let mymap = L.map('mapid').setView([20.5937, 78.9629], 6);
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 8,
            minZoom: 5,
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'your.mapbox.access.token'
        }).addTo(mymap);
        mymap.scrollWheelZoom.disable();
        // Reload the map tiles to avoid grey portion due to half loaded map
        setInterval(function () {
            mymap.invalidateSize();
        }, 100);
        // Leaflet Easy Button to get back to original position
        L.easyButton('<span class="material-icons" style="font-size:20px; padding-bottom: 3px; display: inline-flex; vertical-align: middle;">home</span>', function(){
            mymap.flyTo([20.5937, 78.9629], 6);
        }, 'Initial position').addTo(mymap);

        L.easyBar([
            // Leaflet Easy Button to get the previous search
            L.easyButton('<span class="material-icons" style="font-size:20px; padding-bottom: 3px; display: inline-flex; vertical-align: middle;">west</span>', function() {
                let res = lruCache.getPrevSearch();
                if(res==1) {
                    currentFlag = true;
                    let getBothIndex = lruCache.getRecentSearch()[lruCache.current].data.key.split('-');
                    sourceDropdown.selectedIndex = parseInt(getBothIndex[0]) + 1;
                    destDropdown.selectedIndex = parseInt(getBothIndex[1]) + 1;
                    calculateBtn.click();
                    currentFlag = false;
                } else {
                    if(res==2) {
                        alert("No searches made so far!");
                    } else {
                        alert("This is the oldest search available!");
                    }
                }
            }, 'Previous search'),
            // Leaflet Easy Button to get the next search
            L.easyButton('<span class="material-icons" style="font-size:20px; padding-bottom: 3px; display: inline-flex; vertical-align: middle;">east</span>', function() {
                let res = lruCache.getNextSearch();
                if(res==1) {
                    currentFlag = true;
                    let getBothIndex = lruCache.getRecentSearch()[lruCache.current].data.key.split('-');
                    sourceDropdown.selectedIndex = parseInt(getBothIndex[0]) + 1;
                    destDropdown.selectedIndex = parseInt(getBothIndex[1]) + 1;
                    calculateBtn.click();
                    currentFlag = false;
                } else {
                    if(res==2) {
                        alert("No searches made so far!");
                    } else {
                        flag = false;
                        alert("This is the latest search available!");
                    }
                }
            }, 'Next search'),
        ]).addTo(mymap);

        // Leaflet Control to view and exit fullscreen
        mymap.addControl(new L.Control.Fullscreen({
            title: {
                'false': 'View Fullscreen',
                'true': 'Exit Fullscreen'
            }
        }));

        // Get JSON cities data
        let locations = await getLocation();
        // Get JSON connections data
        let edgeData = await getConnection();
        // Get list of names of all locations
        let COVIDData;
        try {
            COVIDData = await getCovidData();
        } catch(e) {
            alert(e.toString());
        }
        getNameList(locations, graph, sourceDropdown, destDropdown);
        for(let i=0;i<locations.length;i++) {
            let marker = new L.marker([locations[i].latitude, locations[i].longitude]).bindPopup(locations[i].location).addTo(mymap);
        }

        // Add edges to graph
        edgeData.forEach((item) => {
            let convertedTime = timeIntoMinutes(item.time);
            graph.addEdges(item.source, item.destination, item.distance, convertedTime);
            let sourceCoords = graph.getCoordsOfLocation(item.source, 'coords');
            let destCoords = graph.getCoordsOfLocation(item.destination, 'coords');
            let polyline = L.polyline([sourceCoords, destCoords], {color: '#005A9C'}).addTo(mymap);
        });

        calculateBtn.addEventListener('click', () => {
            let sourceLocation = sourceDropdown.options[sourceDropdown.selectedIndex].value;
            let destLocation = destDropdown.options[destDropdown.selectedIndex].value;
            resultp.innerHTML = '';
            let result = '';
            if(sourceLocation=='default' || destLocation=='default') {
                result = '<h3> No Result Available! </h3>';
                result += '<h5> Source location and destination location are needed for calculation ! </h5>';
            } else if(sourceLocation==destLocation) {
                result = '<h3> No Result Available! </h3>';
                result += '<h5> Source location and destination location should not be same! </h5>';
            } else {
                let distance, updatedTime;
                let sourceIndex = graph.getCoordsOfLocation(sourceLocation, 'index');
                let destIndex = graph.getCoordsOfLocation(destLocation, 'index');
                let resultKey = String(sourceIndex) + '-' + String(destIndex);
                let reverseKey = String(destIndex) + '-' + String(sourceIndex);
                let alreadyPresent = lruCache.findNode(resultKey, reverseKey);
                if(alreadyPresent === undefined) {
                    graph.dijkstraShortestPath(sourceLocation, destLocation, mymap);
                    lruCache.addNode(resultKey, {'key': resultKey, 'source': sourceLocation, 'destination': destLocation, 'distance': graph.totalDistance, 'time': graph.getTimeInTimeFormat(), 'routes': graph.selectedNodes});
                    distance = String(graph.totalDistance);
                    updatedTime = graph.getTimeInTimeFormat();
                    resultLocations = graph.getSelectedNodes();
                } else {
                    removePath(graph, resultLocations, mymap);
                    distance = alreadyPresent.data.distance;
                    updatedTime = alreadyPresent.data.time;
                    resultLocations = alreadyPresent.data.routes;
                    if(sourceLocation != alreadyPresent.data.source) {
                        resultLocations = resultLocations.reverse();
                    }
                    addPath(graph, resultLocations, mymap);
                }

                result += '<h3> Details for journey from ' + sourceLocation + ' to ' + destLocation + ' </h3> <br />';
                result += '<h5> Total distance calculated between ' + sourceLocation + ' to ' + destLocation + ' is ' + distance + '<span class="unit"> km </span>. </h5>';
                result += '<h5> Approx. total time to reach the desired location is ' + updatedTime +'. </h5> <br />';
                result += '<h5> Path followed to reach the destination: ';
                result +=  resultLocations[0];
                for(let i = 1; i < resultLocations.length; i++) {
                    result += ' &rarr; ' + resultLocations[i];
                }
                result += ' </h5>';
                updateCOVIDStats(graph, destLocation, COVIDData);
                if(currentFlag == false) {
                    updateRecentSearch(graph, lruCache.getRecentSearch());
                }
            }
            resultp.innerHTML = result;
        });

        document.querySelector('.nav-link').addEventListener('click', () => {
            window.scrollTo(0,0);
        })

        getStartedBtn.addEventListener('click', () => {
            calculateTab.click();
            window.scrollTo(0,0);
        });

        document.addEventListener('click',function(e){
            if(e.target && e.target.className.includes('check-btn')) {
                let getBothIndex = lruCache.cacheMap[e.target.id].key.split('-');
                sourceDropdown.selectedIndex = parseInt(getBothIndex[0]) + 1;
                destDropdown.selectedIndex = parseInt(getBothIndex[1]) + 1;
                calculateBtn.click();
            }
        });
    })();
}
