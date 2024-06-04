<?

// ini_set('display_errors', true);
// ini_set('error_reporting', E_ALL);


ini_set("max_input_vars", 5000);
require_once("/web/include/projects/include.inc");
require_once("/web/include/projects/new.inc");
//require_once("./admin/admin_auth.inc");
//require_once("./admin/ender_columns.inc");
//require_once("/web/html/registration/Admin/classes_pdo.inc");

//$level = checkPermissions();
//echo "level $level";
$peopleDB = sqlPeopleConnect();
$mySql = sqlUpdateConnect();
global $current_user;





if ($_REQUEST['action'] == "updateProjectLocation") {
    if (!($current_user == 'dbo3' || $current_user == 'nnp278' || $current_user ==  'ser406')) {
        echo "You do not have permission to update project locations";
        return;
    }
    $venue_id = $_REQUEST['venue_id'];
    $project_id = $_REQUEST['project_id'];
    $map_file_name = $_REQUEST['map_file_name'];
    if ($map_file_name == "") {
        $map_file_name = "none";
    }
    $printed_map_key = $_REQUEST['printed_map_key'];
    if ($printed_map_key == "") {
        $printed_map_key = 0;
    }
    $x = floatval($_REQUEST['x']);
    if ($x == "") {
        $x = -900;
    }
    $y = floatval($_REQUEST['y']);
    if ($y == "") {
        $y = -900;
    }
    $w = $_REQUEST['w'];
    if ($w == "") {
        $w = 0;
    }
    $h = $_REQUEST['h'];
    if ($h == "") {
        $h = 0;
    }
    $requirements = $_REQUEST['requirements'];
    if ($requirements == "") {
        $requirements = '{}';
    }

    //$sucess = updateProjectLocation($project_id, $venue_id, $x, $y, $width, $height);

    $q = "select * from projects_db.venueProjectLocations where venue_id = $venue_id and project_id = $project_id";
    $sqlResponse = sqlQuery($q);

    if (count($sqlResponse) == 0) {
        $q1 = "INSERT INTO projects_db.venueProjectLocations (venue_id, project_id, map_file_name, printed_map_key, x_norm, y_norm, w_norm, h_norm,requirements) VALUES ($venue_id, $project_id, '$map_file_name', $printed_map_key, $x, $y, $w, $h, '$requirements')";
    } else {
        $q1 = "UPDATE projects_db.venueProjectLocations SET map_file_name = '$map_file_name', printed_map_key = $printed_map_key, x_norm = $x, y_norm = $y, w_norm = $w, h_norm = $h, requirements ='$requirements' WHERE venue_id = $venue_id AND project_id = $project_id";
    }
    $success = sqlQuery($q1);
    // Process the data and send a response back to the client
    $response = [
        'okay' => 'indeed',
        //'success' => $success,
        //'q' => $q,
        //'q1' => $q1,
        'requirements' => $requirements,
    ];
    // Convert the response to JSON format
    $jsonResponse = json_encode($response);
    // Set the response headers
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *'); // Allow requests from any origin
    // Send the response back to the client
    // echo $jsonResponse;

    echo  $jsonResponse;
}


if ($_REQUEST['action'] == "getShowProjectsAndLocations") {

    $venue_id = $_REQUEST['venue_id'];

    //maybe a betterr call available to get all information
    //$allProjects = getAllProjectsUsersPerVenue($venue_id,  "vp.approved");
    $allProjects = getApprovedProjectsPerVenue($venue_id);

    $users = getAllProjectsUsersPerVenue($venue_id, "up.user_id");
    $classes = getAllProjectsClassesPerVenue($venue_id, "c.class_name");

    for ($i = 0; $i < sizeof($allProjects); $i++) {
        $project_id = $allProjects[$i]['project_id'];
        //maybe a betterr call available to get all information
        $place = getProjectLocation($project_id, $venue_id);
        $timestamp = getProjectVenueTimestamp($project_id, $venue_id);
        $mainImage = getProjectMainImage($project_id);
        $diagram = getProjectDiagram($project_id);
        $allProjects[$i]['timestamp'] = $timestamp;
        $allProjects[$i]['mainImage'] = $mainImage;
        $allProjects[$i]['diagram'] = $diagram;
        if ($place) {
            $allProjects[$i]['x_norm'] = $place['x_norm'];
            $allProjects[$i]['y_norm'] = $place['y_norm'];
            $allProjects[$i]['w_norm'] = $place['w_norm'];
            $allProjects[$i]['h_norm'] = $place['h_norm'];

            $allProjects[$i]['printed_map_key'] = $place['printed_map_key'];
            // if ($place['requirements'] == "") {
            //     $place['requirements'] = "{}";
            // }
            $allProjects[$i]['requirements'] = $place['requirements'];
        } else {
            $allProjects[$i]['x_norm'] = -100;
            $allProjects[$i]['y_norm'] = -100;
            $allProjects[$i]['w_norm'] = 0;
            $allProjects[$i]['h_norm'] = 0;
            $allProjects[$i]['printed_map_key'] = 0;
            $allProjects[$i]['requirements'] = "{}";
        }
    }
    $response = [
        'output' => $allProjects,
        'users' => $users,
        'classes' => $classes,
        'netid' => $current_user,
        // 'output' => "hi"
    ];


    $jsonResponse = json_encode($response, JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE);
    // // Set the response headers
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *'); // Allow requests from any origin
    // // Send the response back to the client
    echo $jsonResponse;
    //return;
    //echo "getShowProjectsAndLocations";
}
