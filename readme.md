# Optimizd - Optimal Distance Calculator
**Optimizd** is a web application that provides the optimal travel route by road between Indian cities. Graph data structure is used to represent the network of roads connected with different cities. I have used Leaflet JS to embed interactive map to the application. The cities representes the vertices of the graph and the connections between these cities represents the edges. Dijkstra's single source shortest path algorithm is being used to calculate the optimal route between two cities. Doubly linked list is used to store the recently searched results with each recent search being stored as a node. When a new search is made, the search result get inserted to the beginning of the doubly linked list. COVID-19 stats are also being displayed for the destination location selected. This project was built to demonstrate the use of Data Structures in real life applications. 

**Tech Stack Used:** HTML 5, CSS, JavaScript, Bootstrap 5, Leaflet.js  
**APIs Used:** [COVID-19 API](https://github.com/covid19india/api)  
**Vector illustrations** used in the project are taken from [undraw.co](https://undraw.co/)

## Steps to run the app locally
> Assuming you already have Git and NPM installed on your system and know how to use command prompt/terminal.
* Open command prompt (or terminal) and change the current working directory to location where you want to clone the repository.
* Then type: *git clone https://github.com/OptimalLearner/Optimizd.git*
* If the clone was successfully completed then a new sub directory may appear with the same name as the repository.
* Now change the currently directory to the new sub directory.
* Install http server using this command: *npm install --global http-server* (This step can be skipped if you already have http-server installed)
* Then simply return to main directory and run the http-server using this command: *http-server -p 5500*
* Now you can access the app on http://localhost:5500/