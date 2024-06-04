let venue_id = 204;
let map_file_name = "ShowMap24.png";
let mainImageDir = "https://itp.nyu.edu/projects_documents/"



let showplan;
let horizontal = 1000;
let projects = [];
let selectedProject = null;
let xpos = 0.1;
let ypos = 0.1;
let mouseDownPos = null;
let interfaceDiv;
let fontSize = 10;
let keyAjustmentTimer = setTimeout(sendInKeyAdjustments, 2000);
let requirementsMode = "filter";
let filterTitle;
let filterWidth = 175;
let taggingTarget = null;
let byTimeStamp = {};
let byXPos = {};
let byProjectID = {};
let pullDowns = [];
let requirementColorCode = { "projectType": "purple", "lighting": "green", "sound": "blue", "space": "yellow" };
let showRequirements = false;
let byClass = {};
let byPerson = {};
let byMapKey = {};
let byProjectName = {};
let user = "admin";
let showTitle = false;
let keyRects = [];
let howManyLoaded = 0;
let howManyNeedLoading = 0;
//let keyGrahics;
let selectionRect = [0, 0, 0, 0];
let loadImages = false;
let showPriority = false;
let showInfo = true;  //show image and diagram
let producers = ['dbo3', 'nnp278', 'ser406']
let hasDragged = false;




////////////////////////////////////////////////////////////////
//  PROJECT CLASS
class Project {

    constructor(x, y, name, project_id, w, h, printed_map_key, requirements, timestamp, image_url, diagram_url) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.project_id = project_id;
        this.w = w;
        this.h = h;
        this.printed_map_key = printed_map_key;
        this.requirements = requirements;
        this.selected = false;
        this.timestamp = Date.parse(timestamp);
        this.earlyRank = 0;
        this.image_url = image_url;
        this.diagram_url = diagram_url;
        this.showImage = false;
        this.searchedFor = false;

        //console.log("loading image", mainImageDir + this.image_url);
        this.img = null;
        this.diagram = null;


        this.repaint();
    }

    loadImages() {
        if (loadImages) {
            if (this.image_url != "noImage") {
                this.img = this.img = loadImage(mainImageDir + this.image_url, function () { howManyLoaded++ }, function () { howManyNeedLoading--; console.log("apologies error loading image") });
            }
            if (diagram_url != "noImage") {
                this.diagram = loadImage(mainImageDir + this.diagram_url, function () { howManyLoaded++ }, function () { howManyNeedLoading--; console.log("apologies error loading image") });
            }
        }

    }
    move() {
        this.x = float(mouseX) / width;
        this.y = float(mouseY) / height;
    }

    repaint() {
        //console.log("fontsize", fontSize);
        let shortName = this.name.substring(0, 10);
        let ellipseColor = color(250, 50, 50);
        if (showPriority) {
            ellipseColor = color(255 - this.earlyRank, 0, 0);
        }
        if (this == selectedProject) {
            ellipseColor = color(0, 255, 0);
        }
        if (this.selected) {
            ellipseColor = color(0, 255, 0);
            shortName = this.name;
        }
        if (this.searchedFor) {
            ellipseColor = color(0, 255, 0);
        }

        fill(ellipseColor);
        let ellipseSize = fontSize * 2;
        ellipse(this.x * width, this.y * height, ellipseSize, ellipseSize);
        fill(255);
        textSize(fontSize)
        let keyText = this.printed_map_key + "";
        let keyTextWidth = textWidth(keyText);
        text(keyText, this.x * width - keyTextWidth / 2, this.y * height + 6);
        if (showInfo && this == selectedProject && producers.includes(user)) {
            this.showInfo();
        }

        // stroke(0);
        // noFill();
        // rect(this.x * width, this.y * height, this.w * width, this.h * height);

        if (showTitle || this.selected) {
            fill(0);
            noStroke();
            text(shortName, this.x * width + ellipseSize / 2 + 1, this.y * height + 5);
        }

    }


    showInfo() {

        fill(0)
        let leftOffset = width - width * 0.2;
        let offset = height / 4 + 20;

        let date = new Date(this.timestamp);
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        textSize(18);
        text(this.name, leftOffset, offset);
        textSize(12)
        offset += 30;
        text(this.printed_map_key + ":" + this.earlyRank + "  " + month + "/" + day + " " + hours + ":" + minutes, leftOffset, offset);
        offset += 20;
        fill("purple");



        noStroke();

        //+ "  " + month + "/" + day + " " + hours + ":" + minutes
        text("Early:" + this.earlyRank, leftOffset, offset);
        offset += 12;
        for (let key in this.requirements) {
            //ill(requirementColorCode[key]);
            // console.log(key);
            fill(requirementColorCode[key]);
            text(this.requirements[key], leftOffset, 40 + offset);
            offset += 12;
        }
        if (this.img) {
            image(this.img, width - 340, offset, 320, 320);
        }
        offset += 320;
        if (this.diagram) {
            image(this.diagram, width - 340, offset, 320, 320);
        }


    }
}

////////////////////////////////////////////////////////////////
//  P5 FUNCTIONS
function preload() {
    showplan = loadImage(map_file_name);
}

function setup() {
    fontSize = windowWidth / 130;
    let horizontal = windowWidth;
    let vertical = 0.91 * horizontal;
    //keyGraphics = createGraphics(horizontal, vertical);
    let canvas = createCanvas(horizontal, vertical);
    canvas.elt.style.zIndex = 1;
    canvas.elt.ondblclick = canvasMouseDoubleClicked;
    canvas.elt.onmousemove = canvasMouseMoved;
    canvas.elt.onmousedown = canvasMousePressed;
    canvas.elt.onmouseup = canvasMouseReleased;
    //canvas.elt.onmousedrag = canvasMouseDragged;
    canvas.elt.onkeydown = canvasKeyPressed;

    ellipseMode(CENTER);
    //rectMode(CENTER);

    let url = "https://itp.nyu.edu/projects/showMapUpdate.php?venue_id=" + venue_id + "&action=getShowProjectsAndLocations";
    //console.log(url);
    httpGet(url, gotDBSync, function (error) {
        console.log("did not get it", error);
    });

    connectToFirebase();
}

function draw() {
    background(220);
    image(showplan, 0, 0, width, height);
    for (let i = 0; i < projects.length; i++) {
        let thisProject = projects[i];
        thisProject.repaint();
    }

    if (loadImages) {
        fill(255, 0, 0);
        textSize(24);
        if (howManyNeedLoading == howManyLoaded)
            text("Images All Loaded", 20, 30);
        else
            text("Loading: " + howManyLoaded + " / " + howManyNeedLoading, 20, 30);
    }

    //image(keyGraphics, 0, height / 2);
    noFill();
    stroke(0);
    rect(selectionRect[0], selectionRect[1], selectionRect[2] - selectionRect[0], selectionRect[3] - selectionRect[1]);

    if (selectedProject) {
        textSize(32);
        fill(50, 0, 50);
        stroke(255);
        let keyTextWidth = textWidth(selectedProject.name);
        text(selectedProject.name, selectedProject.x * width - keyTextWidth / 2, selectedProject.y * height + 6);
    }
}


function makeKey() {

    console.log("MAKING key");
    let keyHolder = document.getElementById("keyHolder");
    let keyHolderWidth = (width - width * .1)
    if (!keyHolder) {
        keyHolder = document.createElement("div");
        keyHolder.id = "keyHolder"
        keyHolder.style.position = "absolute";
        keyHolder.style.top = "15%";
        keyHolder.style.left = "5%";
        keyHolder.style.width = keyHolderWidth + "px";
        keyHolder.style.height = height / 3 + "px";
        keyHolder.style.backgroundColor = "white";
        keyHolder.style.overflow = "scroll";
        keyHolder.style.zIndex = "1000";
        document.body.appendChild(keyHolder);
        keyHolder.style.display = "none";
    } else {
        keyHolder.innerHTML = "";
    }
    ////////////BY PROJECT NAME KEY
    let topOffset = 0; //height / 2
    keyRects = [];
    let hSpacing = keyHolderWidth / 12;
    let keyY = topOffset; //height / 2
    let keyX = 20;
    for (key in byMapKey) {
        let projectList = [];
        projectList.push(byMapKey[key].project_id);
        let shortName = byMapKey[key].name.substring(0, 16);
        let thisDiv = document.createElement("div");
        thisDiv.innerHTML = key + "     " + shortName;
        thisDiv.name = projectList.join(",");
        thisDiv.style.cursor = "pointer";
        thisDiv.id = "key_" + key;
        thisDiv.className = "keyer";
        thisDiv.cla = "keyer";
        thisDiv.style.position = "absolute";
        thisDiv.style.top = keyY + "px";
        thisDiv.style.left = keyX + "px";
        thisDiv.style.zIndex = "1000";
        thisDiv.style.color = "#2222ff";
        thisDiv.style.zIndex = 3000;
        thisDiv.style.fontSize = fontSize + "px";
        thisDiv.style.padding = "2px";
        thisDiv.style.border = "0px solid black";
        thisDiv.style.borderRadius = "2px";
        keyHolder.appendChild(thisDiv);
        thisDiv.style.zIndex = 1500;
        thisDiv.onclick = clickedOnKey;
        keyY += fontSize + 5;
        if (key % 35 == 0) {
            keyY = topOffset; //height / 2;
            keyX += hSpacing;
        }
    }
    topOffset = 0; //biggestKey + 30;
    let num = 1;
    keyY = topOffset;
    keyX = keyX + hSpacing + hSpacing / 2;

    //////////////////PERSON KEY
    for (key in byPerson) {
        let projectList = [];
        //keyGraphics.fill(250, 200, 200);
        // ellipse(keyX, keyY, 25, 25);
        //keyGraphics.fill(0);
        //let names = key.split(" ");
        let names = key.split(/[- ]+/);
        if (names.length > 2) shorName = names[0];
        let shortName = names[0] + " " + names[names.length - 1];

        shortName = shortName.substring(0, 20);
        if (byPerson[key].projects.length > 2) shortName = names[0];
        let nameWidth = textWidth(shortName);
        //keyGraphics.text(shortName, keyX, keyY);
        let projectKeys = "";
        for (let i = 0; i < byPerson[key].projects.length; i++) {
            let projectID = byPerson[key].projects[i];
            let project = byProjectID[projectID];
            projectKeys += project.printed_map_key + " ";
            projectList.push(project.project_id);
        }
        let thisDiv = document.createElement("div");
        thisDiv.innerHTML = shortName + " " + projectKeys; // shortName;
        thisDiv.name = projectList.join(",");
        thisDiv.style.cursor = "pointer";
        thisDiv.id = "key_" + key;
        thisDiv.className = "keyer";
        thisDiv.style.position = "absolute";
        thisDiv.style.top = keyY + "px";
        thisDiv.style.left = keyX + "px";
        thisDiv.style.zIndex = "1000";
        thisDiv.style.color = "#111188";
        thisDiv.style.padding = "2px";
        thisDiv.style.border = "0px solid black";
        thisDiv.style.borderRadius = "2px";
        thisDiv.style.fontSize = fontSize + "px";
        keyHolder.appendChild(thisDiv);
        thisDiv.style.zIndex = 1500;
        thisDiv.onclick = clickedOnKey;

        keyY += fontSize + 2;
        if (num % 35 == 0) {
            keyY = topOffset;//height / 2;
            keyX += hSpacing;
        }
        num++;
    }
}
function clickedOnKey(e) {
    let showKeyButton = document.getElementById("showKeyButton");
    showKeyButton.innerHTML = "Show Key";
    console.log("clicked on key single event  Person", this.name);
    document.getElementById("keyHolder").style.display = "none";
    let projectList = this.name.split(",");
    for (let i = 0; i < projects.length; i++) {
        let thisProject = projects[i];
        thisProject.searchedFor = false;
    }
    for (let i = 0; i < projectList.length; i++) {
        let projectID = projectList[i];
        byProjectID[projectID].searchedFor = true;
        selectedProject = byProjectID[projectID];
    }
    e.stopPropagation();
}

////////////////////////////////////////////////////////////////
//  NETOWRKING FUNCTIONS
function gotDBSync(data) {
    data = JSON.parse(data);
    //console.log('netid', data.netid);
    user = data.netid;
    //user = 'admin';
    //console.log(data.output);
    //console.log(data.classes);
    // console.log(data.users);
    let ypos = - 0.0;
    for (let i = 0; i < data.output.length; i++) {
        let thisProject = data.output[i];

        let newProject;
        xpos = xpos + 0.06;
        //pos += 0.01;
        if (i % 14 == 0) {
            xpos = .01;
            ypos += 0.001; //+= -0.1;
        }
        if (thisProject.mainImage.length == 0) {
            image_url = "noImage";
        } else {
            howManyNeedLoading++
            image_url = thisProject.mainImage[0].document;
        }
        if (thisProject.diagram.length == 0) {
            diagram_url = "noImage";
        } else {
            diagram_url = thisProject.diagram[0].document;
            howManyNeedLoading++
        }
        if (thisProject.x_norm == -100) {
            newProject = new Project(xpos, ypos, thisProject.project_name, thisProject.project_id, 0.0, 0.0, 0, {}, thisProject.timestamp, mainImageDir, image_url, diagram_url);
            //projects.push(newProject);
        } else {
            newProject = new Project(thisProject.x_norm, thisProject.y_norm, thisProject.project_name, thisProject.project_id, thisProject.w_norm, thisProject.h_norm, thisProject.printed_map_key, JSON.parse(thisProject.requirements), thisProject.timestamp, image_url, diagram_url);
        }
        projects.push(newProject);
        byTimeStamp[thisProject.timestamp] = newProject;
        let bottomHalf = 0;
        if (newProject.y > 0.25) {
            bottomHalf = 1.0
            console.log("bottom half");
        }
        byXPos[newProject.x + i * 0.00000001 + bottomHalf] = newProject;
        byProjectID[thisProject.project_id] = newProject;
        byProjectName[thisProject.project_name] = [newProject.project_id]
    }

    let projectNameKeys = Object.keys(byProjectName);
    projectNameKeys.sort();
    let byProjectNameSorted = {};
    for (let i = 0; i < projectNameKeys.length; i++) {
        let key = projectNameKeys[i];
        byProjectNameSorted[key] = byProjectName[key];
    }
    byProjectName = byProjectNameSorted;

    let keys = Object.keys(byTimeStamp);
    let total = keys.length;
    keys.sort().reverse();
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let project = byTimeStamp[key];
        project.earlyRank = total - i;
    }

    let keysY = Object.keys(byXPos);
    byMapKey = {};
    keysY.sort();//.reverse();
    for (let i = 0; i < keysY.length; i++) {
        let key = keysY[i];
        let project = byXPos[key];
        project.printed_map_key = i + 1;
        byMapKey[project.printed_map_key] = project;
    }
    /////CLASSES

    for (let i = 0; i < data.classes.length; i++) {
        let thisProject = data.classes[i];
        if (thisProject.approved != 1) continue;
        let thisName = thisProject.class_name.substring(0, 30);
        if (!byClass[thisName]) {
            byClass[thisName] = [thisProject.project_id];
        } else {
            byClass[thisName].push(thisProject.project_id);
        }
    }
    let keysClass = Object.keys(byClass);
    keysClass.sort(function (a, b) {
        return byClass[b].length - byClass[a].length
    });
    let byMostProjectsInClass = {};
    for (let i = 0; i < keysClass.length; i++) {
        let key = keysClass[i];
        let projects = byClass[key];
        byMostProjectsInClass[key] = projects;
    }
    //console.log("most ", byMostProjectsInClass);
    byClass = byMostProjectsInClass;
    //console.log(keysClass);



    /////USERS
    for (let i = 0; i < data.users.length; i++) {
        let thisProject = data.users[i];
        if (thisProject.approved != 1) continue;
        let theName = thisProject.user_name.trim();

        if (!byPerson[theName]) {
            byPerson[theName] = { "projects": [thisProject.project_id], "user_name": theName, 'user_id': thisProject.user_id };
        } else {
            byPerson[theName].projects.push(thisProject.project_id);
        }
    }

    let keysPerson = Object.keys(byPerson);
    keysPerson.sort(); //function (a, b) {
    //return byPerson[b].user_name - byPerson[a].user_name
    //});
    let alphabetized = {};
    for (let i = 0; i < keysPerson.length; i++) {
        let key = keysPerson[i];
        alphabetized[key] = byPerson[key];
    }
    byPerson = alphabetized;

    //SORT BY MOST PROJECTS
    // let keysPerson = Object.keys(byPerson);
    // keysPerson.sort(function (a, b) {
    //   return byPerson[b].projects.length - byPerson[a].projects.length
    // });
    // let byMostProjectsByPerson = {};
    // for (let i = 0; i < keysPerson.length; i++) {
    //   let key = keysPerson[i];
    //   let projects = byPerson[key];
    //   byMostProjectsByPerson[key] = projects;
    // }
    // console.log("most ", byMostProjectsByPerson);
    // byPerson = byMostProjectsByPerson;

    //console.log(byProjectID);
    //console.log(byClass);
    //console.log(byPerson);
    makeKey();
    let kh = document.getElementById("keyHolder");
    console.log(kh);

    createSearchInterface();
    createRequirementsInterface();


    if (!producers.includes(user)) interfaceDiv.style.display = "none";
    interfaceDiv.style.display = "none";
}

function sendInKeyAdjustments() {
    if (selectedProject) {
        //console.log("sending in key adjustments");
        updateProjectDB(selectedProject);
    }
}

function sendInRequirements() {
    if (taggingTarget) {
        //console.log("sending in key adjustments");
        let selectedProject = taggingTarget;
        updateProjectDB(selectedProject);

    }
}
function updateProjectDB(selectedProject) {
    let url = "https://itp.nyu.edu/projects/showMapUpdate.php?venue_id=" + venue_id + "&action=updateProjectLocation&project_id=" + selectedProject.project_id + "&x=" + selectedProject.x + "&y=" + selectedProject.y + "&w= " + selectedProject.w + "&h=" + selectedProject.h + "&map_file_name=" + map_file_name + "&printed_map_key=" + selectedProject.printed_map_key + "&requirements=" + JSON.stringify(selectedProject.requirements);

    // let url = "https://itp.nyu.edu/projects/showMapUpdate.php?venue_id=" + venue_id + "&action=updateProjectLocation&project_id=" + selectedProject.project_id + "&x=" + selectedProject.x + "&y=" + selectedProject.y + "&w= " + selectedProject.w + "&h=" + selectedProject.h + "&map_file_name=" + map_file_name + "&printed_map_key=" + selectedProject.printed_map_key;
    console.log("SENT", url);
    httpGet(url,
        function (data) {
            console.log(data)
            setLocationInFirebase(selectedProject.x, selectedProject.y, selectedProject.project_id, selectedProject.name, selectedProject.w, selectedProject.h);

        },
        function (error) {
            console.log('got errorr', error)
            alert("Error in sending To DB");
        }
    );
}

////////////////////////////////////////////////////////////////
//  MOUSE and KEY FUNCTIONS

function findClosestProject(min) {
    let closeOne = null;
    let distances = {}
    for (let i = 0; i < projects.length; i++) {
        let thisProject = projects[i];
        let x = float(mouseX) / width;
        let y = float(mouseY) / height;
        let distance = dist(x, y, thisProject.x, thisProject.y);
        distances[distance] = thisProject;
    }
    let keys = Object.keys(distances);
    keys.sort();
    let closest = distances[keys[0]];
    if (keys[0] < min) {
        closeOne = closest;
    }
    return closeOne;
}


//function mousePressed() {
function canvasMousePressed() {
    mouseDownPos = [mouseX, mouseY];
    selectedProject = findClosestProject(0.01);
    let showKeyButton = document.getElementById("showKeyButton");
    showKeyButton.innerHTML = "Show Key";
    console.log("clicked on key single event  Person", this.name);
    document.getElementById("keyHolder").style.display = "none";
    if (producers.includes(user)) {

        selectedProject = findClosestProject(0.01);

        if (selectedProject) {
            selectedProject.selected = true;
            // filterTitle.innerHTML = selectedProject.name;
            // requirementsMode == "tagging";
            // taggingTarget = selectedProject;
            // setPullDownValues(selectedProject);
            // document.getElementById("selectClass").style.display = "none";
            // document.getElementById("selectPerson").style.display = "none";
            // document.getElementById("selectProject").style.display = "none";
            // } else if (requirementsMode != "tagging") {
            //   taggingTarget = null;
            // }

            selectionRect = [0, 0, 0, 0];
        } else {
            //console.log("clicked outside");
            // mouseDownPos = [mouseX, mouseY];
            for (let i = 0; i < projects.length; i++) {
                let thisProject = projects[i];
                //if (thisProject != selectedProject) {
                thisProject.selected = false;
                thisProject.searchedFor = false;
                // }
            }

        }
    }
    //let first= selectedProject.name.split(" ")[0]
    if (!producers.includes(user))
        //window.open("https://itp.nyu.edu/shows/spring2024/projects/#" + selectedProject.project_id, "_projectDetails");
        window.open("https://itp.nyu.edu/shows/spring2024/projects/#" + selectedProject.project_id);


}

function canvasMouseMoved() {

    if (mouseDownPos != null) {
        console.log("dragging", mouseDownPos);
        hasDragged = true;
        if (producers.includes(user)) {
            if (selectedProject) {
                selectedProject.move();
            }
            //
            // } else if (mouseDownPos[0] != 0 && mouseDownPos[1] != 0) {
            //   selectionRect = [mouseDownPos[0], mouseDownPos[1], mouseX, mouseY];
            // }
        }
    } else {
        //if (!showTitle) {
        for (let i = 0; i < projects.length; i++) {
            let thisProject = projects[i];
            if (thisProject != selectedProject) {
                thisProject.selected = false;
                thisProject.showImage = false;
            }
        }

        selectedProject = findClosestProject(0.01);


        // if (selectedProject) {
        //     // console.log("hovering over", selectedProject.name);
        //     selectedProject.selected = true;
        //     //selectedProject.showImage = true;
        // }
    }


    // for (let i = 0; i < keyRects.length; i++) {
    //   let r = keyRects[i];
    //   rect(r.x, r.y, r.w, r.h);
    //   // if (mouseX > r.x, mouseY > r.y, mouseX < r.x + r.w, mouseY < r.y + r.h) {
    //   //   let projectList = r.projects;
    //   //   console.log("hovering over", projectList);
    //   //   for (let j = 0; j < projectList.length; j++) {
    //   //     let projectID = projectList[j];
    //   //     byProjectID[projectID].selected = true;
    //   //   }
    //   // }
    // }
    //}

}


// function canvasMouseDragged() {
//     if (mouseDownPos) {
//         if (producers.includes(user)) {
//             if (selectedProject) {
//                 selectedProject.move();
//             }
//             //
//             // } else if (mouseDownPos[0] != 0 && mouseDownPos[1] != 0) {
//             //   selectionRect = [mouseDownPos[0], mouseDownPos[1], mouseX, mouseY];
//             // }
//         }
//     }
// }



function canvasMouseReleased() {

    if (producers.includes(user)) {
        if (mouseDownPos) {
            let distanceSincePressed = dist(mouseDownPos[0], mouseDownPos[1], mouseX, mouseY);
            if (selectedProject) {
                //if (dragged) {
                if (hasDragged && distanceSincePressed > 5) {
                    updateProjectDB(selectedProject);
                }
            }
        }
        makeKey();
        if (mouseY > height / 2) {
            console.log("clicked on key");
            for (let i = 0; i < keyRects.length; i++) {
                let r = keyRects[i];
                // console.log(mouseX, mouseY - height / 2, r.x, r.y);
                // if (dist(mouseX, mouseY - height / 2, r.x, r.y ) < 20) {
                if (mouseX > r.x, mouseY - height / 2 > r.y, mouseX < r.x + r.w, mouseY - height / 2 < r.y + 12) {
                    keyGraphics.rect(r.x, r.y, r.w, r.h);
                    let projectList = r.projects;
                    console.log("clicked on key ", r.projects);
                    for (let j = 0; j < projectList.length; j++) {
                        let projectID = projectList[j];
                        console.log("hovering over", byProjectID[projectID].name);

                        //byProjectID[projectID].selected = true;
                    }
                    break;
                }
            }
        }
        if (selectionRect[0] != selectionRect[2]) {
            for (let i = 0; i < projects.length; i++) {
                let thisProject = projects[i];
                if (thisProject.x * width > selectionRect[0] && thisProject.x * width < selectionRect[2] && thisProject.y * height > selectionRect[1] && thisProject.y * height < selectionRect[3]) {
                    thisProject.selected = true;
                }
            }
        }
    }
    hasDragged = false;
    mouseDownPos = null;
}

function canvasMouseDoubleClicked() {
    if (producers.includes(user)) {
        console.log("double clicked");
        selectedProject = findClosestProject(0.01);
        if (selectedProject) {
            selectedProject.selected = true;
            filterTitle.innerHTML = selectedProject.name;
            // interfaceDiv.style.top = mouseY + "px";
            // interfaceDiv.style.left = mouseX + "px";
            requirementsMode == "tagging";
            taggingTarget = selectedProject;
            setPullDownValues(selectedProject);
            document.getElementById("selectClass").style.display = "none";
            document.getElementById("selectPerson").style.display = "none";
            document.getElementById("selectProject").style.display = "none";
            //open web page
            window.open("https://itp.nyu.edu/projects/projectinfo.php?project_id=" + selectedProject.project_id, "_projectDetails");
        }
    }
}

function canvasKeyPressed() {
    if (producers.includes(user)) {
        if (key == "r") {
            console.log("toggle requirements  ");
            showRequirements = !showRequirements;
        }
        if (key == "t") {
            console.log("toggle title  ");
            showTitle = !showTitle
        }
        if (key == "i") {
            console.log("toggle info  ");
            loadImages = true;
            for (let i = 0; i < projects.length; i++) {
                let thisProject = projects[i];
                thisProject.loadImages();
            }
        }
        if (key == "p") {
            console.log("toggle title  ");
            showPriority = !showPriority
        }
        if (key == "k") {
            let output = [];
            for (key in byMapKey) {
                output.push(key + " " + byMapKey[key].name);
            }
            saveStrings(output, "mapKey.txt");

            output = [];
            for (key in byPerson) {
                let person = byPerson[key];
                let projectsList = person.projects;
                let allProject = person.user_name + " ";
                for (let i = 0; i < projectsList.length; i++) {
                    allProject += byProjectID[projectsList[i]].printed_map_key + ","
                }
                output.push(allProject);
            }
            saveStrings(output, "people.txt");
        }
        if (selectedProject) {
            if (keyCode === LEFT_ARROW) {
                if (keyIsDown(SHIFT)) {
                    selectedProject.w -= 0.001;
                } else {
                    selectedProject.x -= 0.001;
                }
            } else if (keyCode === RIGHT_ARROW) {
                if (keyIsDown(SHIFT)) {
                    selectedProject.w += 0.001;

                } else {
                    selectedProject.x += 0.001;

                }
            } else if (keyCode === UP_ARROW) {
                if (keyIsDown(SHIFT)) {
                    selectedProject.h -= 0.001;
                } else {
                    selectedProject.y -= 0.001;
                }
            } else if (keyCode === DOWN_ARROW) {
                if (keyIsDown(SHIFT)) {
                    selectedProject.h += 0.001;
                } else {
                    selectedProject.y += 0.001;
                }
            }
            clearTimeout(keyAjustmentTimer);
            keyAjustmentTimer = setTimeout(sendInKeyAdjustments, 2000);
        }

        if (keyIsDown(OPTION)) {
            let inc = 0.0;
            if (keyCode === LEFT_ARROW) {
                inc = -0.001;
            } else if (keyCode === RIGHT_ARROW) {
                inc = 0.001;
            }
            if (inc != 0) {
                console.log("option");
                for (let i = 0; i < projects.length; i++) {
                    let thisProject = projects[i];
                    if (thisProject.selected) {
                        console.log("proposed move " + thisProject.x, thisProject.x + inc);
                        thisProject.x -= 0.001;
                        //updateProjectDB(thisProject);
                    }
                }
            }
        }
    }

}


function createSearchInterface() {
    //By Person Pulldown
    let selectPerson = document.createElement("select");
    selectPerson.id = "selectPerson";
    selectPerson.name = "selectPerson";
    selectPerson.onchange = selectClassEvent;
    //interfaceDiv.appendChild(selectPerson);
    document.body.appendChild(selectPerson);
    let option1 = document.createElement("option");
    option1.value = -1;
    option1.text = "People";
    selectPerson.appendChild(option1);
    for (let key in byPerson) {
        let projects = byPerson[key].projects;
        let option = document.createElement("option");

        option.value = projects;
        if (projects.length > 1) option.text = byPerson[key].user_name; //+ "  " + projects.length + " ---------";
        else
            option.text = byPerson[key].user_name
        selectPerson.appendChild(option);
    }
    selectPerson.style.display = "block";
    selectPerson.style.position = "absolute";
    selectPerson.style.zIndex = "1000";
    selectPerson.style.top = 5 + "px";
    selectPerson.style.left = 320 + "px";

    //project Name pulldown
    let selectProject = document.createElement("select");
    selectProject.id = "selectProject";
    selectProject.name = "selectProject";
    selectProject.onchange = selectClassEvent;
    document.body.appendChild(selectProject);
    let option = document.createElement("option");
    option.value = -1;
    option.text = "Projects";
    selectProject.appendChild(option);
    for (let key in byProjectName) {
        let projects = byProjectName[key];
        let option = document.createElement("option");
        option.value = projects;
        option.text = key;
        selectProject.appendChild(option);
    }
    selectProject.style.display = "block";
    selectProject.style.position = "absolute";
    selectProject.style.zIndex = "1000";
    selectProject.style.top = 5 + "px";
    selectProject.style.left = 20 + "px";

    let showKeyButton = document.createElement("button");
    showKeyButton.id = "showKeyButton";
    showKeyButton.innerHTML = "Show Key";
    document.body.appendChild(showKeyButton);
    showKeyButton.style.position = "absolute";
    showKeyButton.style.zIndex = "1000";
    showKeyButton.style.top = 5 + "px";
    showKeyButton.style.left = 800 + "px";

    showKeyButton.onclick = function () {
        let keyHolder = document.getElementById("keyHolder");
        if (keyHolder.style.display == "none") {
            keyHolder.style.display = "block";
            showKeyButton.innerHTML = "Hide Key";
        } else {
            keyHolder.style.display = "none";
            showKeyButton.innerHTML = "Show Key";
        }
    }
}




////////////////////////////////////////////////////////////////
//  HTML Filter Interface Functions
function createRequirementsInterface() {
    interfaceDiv = document.createElement("div");
    let projectTypes = ['type', 'Audio-Lab', 'Installation', 'Projection', 'Performance', 'Screen-based', 'Screening', 'Game', 'Objects', 'VR', 'Sound', 'Wall-Piece', 'Wearable'];
    let lighting = ['lighting', 'Light', 'Dim', 'Dark'];
    let sound = ['sound', 'Loud', 'Quiet', 'Silent'];
    let space = ['space', 'Floor', 'Grid', 'Room', 'Table', 'Wall'];

    let filterButton = document.createElement("button");
    filterButton.innerHTML = "Filter Mode";
    filterButton.onclick = function () {
        console.log("filtering");
        filterTitle.innerHTML = "Filtering Projects";
        filterMode = "filtering";
        taggingTarget = null;
        document.getElementById("selectClass").style.display = "block";
        document.getElementById("selectPerson").style.display = "block";
        document.getElementById("selectProject").style.display = "block";

        // for (let i = 0; i < pullDowns.length; i++) {
        //   let pullDown = pullDowns[i];
        //   pullDown.selectedIndex = 0;
        // }
    }
    interfaceDiv.appendChild(filterButton);


    filterTitle = document.createElement("div");
    filterTitle.style.color = "white";
    filterTitle.innerHTML = "Filter Projects";
    interfaceDiv.appendChild(filterTitle);

    interfaceDiv.id = "interfaceDiv";
    document.body.appendChild(interfaceDiv);

    //By Class Pulldown
    let selectClass = document.createElement("select");
    selectClass.id = "selectClass";
    selectClass.name = "selectClass";
    selectClass.onchange = selectClassEvent;
    interfaceDiv.appendChild(selectClass);
    for (let key in byClass) {
        let projects = byClass[key];
        let option = document.createElement("option");
        option.value = projects;
        option.text = key;
        selectClass.appendChild(option);
    }




    ///////projectType, lighting, sound, space
    let selectType = document.createElement("select");
    selectType.id = "projectType";
    selectType.name = "projectType";
    selectType.onchange = mySelectEvent;
    interfaceDiv.appendChild(selectType);
    for (let i = 0; i < projectTypes.length; i++) {
        let option = document.createElement("option");
        if (i == 0) option.value = "None";
        else option.value = projectTypes[i];
        option.text = projectTypes[i];
        selectType.appendChild(option);
    }
    pullDowns.push(selectType);

    let selectLighting = document.createElement("select");
    selectLighting.id = "lighting";
    selectLighting.name = "lighting";
    selectLighting.onchange = mySelectEvent;
    interfaceDiv.appendChild(selectLighting);
    for (let i = 0; i < lighting.length; i++) {
        let option = document.createElement("option");
        if (i == 0) option.value = "None";
        else option.value = lighting[i];
        option.text = lighting[i];
        selectLighting.appendChild(option);
    }
    pullDowns.push(selectLighting);

    let selectSound = document.createElement("select");
    selectSound.id = "sound";
    selectSound.name = "sound";
    selectSound.onchange = mySelectEvent;
    interfaceDiv.appendChild(selectSound);
    for (let i = 0; i < sound.length; i++) {
        let option = document.createElement("option");
        if (i == 0) option.value = "None";
        else option.value = sound[i];
        option.text = sound[i];
        selectSound.appendChild(option);
    }
    pullDowns.push(selectSound);

    let selectSpace = document.createElement("select");
    selectSpace.id = "space";
    selectSpace.name = "space";
    selectSpace.onchange = mySelectEvent;
    interfaceDiv.appendChild(selectSpace);
    for (let i = 0; i < space.length; i++) {
        let option = document.createElement("option");
        if (i == 0) option.value = "None";
        else option.value = space[i];
        option.text = space[i];
        selectSpace.appendChild(option);
    }
    pullDowns.push(selectSpace);

    interfaceDiv.style.position = "absolute";
    interfaceDiv.style.backgroundColor = "purple";
    interfaceDiv.style.padding = "1px";
    interfaceDiv.style.border = "1px solid black";
    interfaceDiv.style.width = filterWidth + "px";
    //interfaceDiv.style.height = "100px";

    // interfaceDiv.style.top = 0 + "px";
    // interfaceDiv.style.left = windowWidth - 600 + "px";
    interfaceDiv.style.top = (height / 2) - 300 + "px";
    interfaceDiv.style.left = windowWidth - 500 + "px";
    interfaceDiv.style.zIndex = "1000";
    //interfaceDiv.style.display = "none";

}

function selectClassEvent(e) {
    let projectsList = e.target.value.split(",");
    for (let i = 0; i < projects.length; i++) {
        let thisProjectID = projects[i].project_id;
        let thisProject = byProjectID[thisProjectID];
        thisProject.searchedFor = false;
    }
    if (e.target.name == "selectPerson") {
        let projectPD = document.getElementById("selectProject");
        projectPD.selectedIndex = 0;
    } else if (e.target.name == "selectProject") {
        let classPD = document.getElementById("selectPerson");
        classPD.selectedIndex = 0;
    }
    console.log("projectlist", projectsList, e.target.value);
    for (let i = 0; i < projects.length; i++) {
        let thisProject = projects[i];
        thisProject.searchedFor = false;
        thisProject.selected = false;
    }
    for (let i = 0; i < projectsList.length; i++) {
        let thisProjectID = projectsList[i];
        let thisProject = byProjectID[thisProjectID];
        thisProject.searchedFor = true;
    }

}




function mySelectEvent(e) {
    if (taggingTarget) { // requirementsMode == "tagging" &&

        //selectedProject.type = this.value;
        let value = e.target.value;
        let name = this.name;
        if (value == "None") {
            delete taggingTarget.requirements[name]
        } else {
            taggingTarget.requirements[name] = value;
            clearTimeout(keyAjustmentTimer);
            keyAjustmentTimer = setTimeout(sendInRequirements, 2000);
        }
    } else if (requirementsMode == "filter") {
        let value = e.target.value;
        let name = this.name;

        for (let i = 0; i < projects.length; i++) {

            let thisProject = projects[i];
            //thisProject.searchedFor = true;
            let requirements = thisProject.requirements;
            thisProject.selected = false;
            for (let key in requirements) {
                // console.log("testing ", name, value, key, requirements[key]);
                if (key == name) {
                    if (requirements[key] == value) {
                        //thisProject.selected = true;
                        thisProject.searchedFor = true;
                    }
                }
            }
        }
    }

}


function setPullDownValues(project) {

    for (let i = 0; i < pullDowns.length; i++) {
        let pullDown = pullDowns[i];
        pullDown.selectedIndex = 0;
    }
    for (key in project.requirements) {
        let value = project.requirements[key];
        let pullDown = document.getElementById(key);

        for (let i = 0; i < pullDown.options.length; i++) {
            if (pullDown.options[i].value == value) {
                pullDown.options[i].selected = true;
                //pullDown.options[i].thisProject.searchedFor = true;
            }
        }
    }

}

function windowResized() {
    console.log("resized");
    // let horizontal = windowWidth;
    // let vertical = 0.82 * horizontal;
    // resizeCanvas(horizontal, vertical);
}



// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDHOrU4Lrtlmk-Af2svvlP8RiGsGvBLb_Q",
    authDomain: "sharedmindss24.firebaseapp.com",
    databaseURL: "https://sharedmindss24-default-rtdb.firebaseio.com",
    projectId: "sharedmindss24",
    storageBucket: "sharedmindss24.appspot.com",
    messagingSenderId: "1039430447930",
    appId: "1:1039430447930:web:edf98d7d993c21017ad603"
};

let group = "showMap";
let typeOfThing = "showProjectLocations"
let db;

function setLocationInFirebase(x_norm, y_norm, project_id, project_name, w_norm, h_norm) {
    let mydata = {
        x_norm: x_norm,
        y_norm: y_norm,
        project_id: project_id,
        project_name: project_name,
        w_norm: w_norm,
        h_norm: h_norm,
    };
    //add a stroke
    //console.log("set location", mydata);
    firebase.database().ref(group + "/" + typeOfThing + "/" + project_id).set(mydata);
    //let dbInfo = db.ref("group/" + group + "/" + typeOfThing + "/").push(mydata);
}

function connectToFirebase() {
    const app = firebase.initializeApp(firebaseConfig);
    db = app.database();

    var myRef = db.ref(group + "/" + typeOfThing + "/");
    // myRef.on("child_added", (data) => {
    //   console.log("add", data.key, data.val());
    // });

    //not used
    myRef.on("child_changed", (data) => {
        //console.log("changed", data.key, data.val());
        let thisProject = byProjectID[data.key];
        thisProject.x = data.val().x_norm;
        thisProject.y = data.val().y_norm;
        //console.log("should change", thisProject.name, thisProject.x, thisProject.y, data.val().x_norm, data.val().y_norm);
    });

}

// let url = "https://itp.nyu.edu/projects/showMapUpdate.php?venue_id=" + venue_id + "&action=updateProjectLocation&project_id=" + selectedProject.project_id + "&x=" + selectedProject.x + "&y=" + selectedProject.y + "&w= " + selectedProject.w + "&h=" + selectedProject.h + "&map_file_name=" + map_file_name + "&printed_map_key=" + selectedProject.printed_map_key + "&requirements=" + JSON.stringify(selectedProject.requirements);
// //let url = "https://itp.nyu.edu/projects/showMapUpdate.php?venue_id=" + venue_id + "&action=updateProjectLocation&project_id=" + selectedProject.project_id + "&x=" + selectedProject.x + "&y=" + selectedProject.y;
// console.log("SENT key press", url);
// httpGet(url,
//   function (data) {
//     console.log('got data', data)
//     setLocationInFirebase(selectedProject.x, selectedProject.y, selectedProject.project_id, selectedProject.name, selectedProject.w, selectedProject.h);
//   },
//   function (error) {
//     console.log('got errorr', error)
//     alert("Error in sending requirements");
//   }
// );
// // console.log("released after move", mouseDownPos, mouseX, mouseY, distanceSincePressed);
// let url = "https://itp.nyu.edu/projects/showMapUpdate.php?venue_id=" + venue_id + "&action=updateProjectLocation&project_id=" + selectedProject.project_id + "&x=" + selectedProject.x + "&y=" + selectedProject.y + "&w= " + selectedProject.w + "&h=" + selectedProject.h + "&map_file_name=" + map_file_name + "&printed_map_key=" + selectedProject.printed_map_key + "&requirements=" + JSON.stringify(selectedProject.requirements);

// // let url = "https://itp.nyu.edu/projects/showMapUpdate.php?venue_id=" + venue_id + "&action=updateProjectLocation&project_id=" + selectedProject.project_id + "&x=" + selectedProject.x + "&y=" + selectedProject.y + "&w= " + selectedProject.w + "&h=" + selectedProject.h + "&map_file_name=" + map_file_name + "&printed_map_key=" + selectedProject.printed_map_key;
// console.log("SENT", url);
// httpGet(url,
//   function (data) {
//     console.log(data)
//     setLocationInFirebase(selectedProject.x, selectedProject.y, selectedProject.project_id, selectedProject.name, selectedProject.w, selectedProject.h);

//   },
//   function (error) {
//     console.log('got errorr', error)
//     alert("Error in sending location");
//   }
// );

// let url = "https://itp.nyu.edu/projects/showMapUpdate.php?venue_id=" + venue_id + "&action=updateProjectLocation&project_id=" + selectedProject.project_id + "&x=" + selectedProject.x + "&y=" + selectedProject.y + "&w= " + selectedProject.w + "&h=" + selectedProject.h + "&map_file_name=" + map_file_name + "&printed_map_key=" + selectedProject.printed_map_key + "&requirements=" + JSON.stringify(selectedProject.requirements);
// //let url = "https://itp.nyu.edu/projects/showMapUpdate.php?venue_id=" + venue_id + "&action=updateProjectLocation&project_id=" + selectedProject.project_id + "&x=" + selectedProject.x + "&y=" + selectedProject.y;
// //console.log("send in requirements", url);
// httpGet(url,
//   function (data) {
//     console.log('got data', data)
//   },
//   function (error) {
//     console.log('got errorr', error)
//     alert("Error in sending requirements");
//   }
// );