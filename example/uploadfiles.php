<?php
    if (!empty($_FILES)) {
        move_uploaded_file($_FILES['file']['tmp_name'], 'files/' . $_FILES['file']['name']);

        $data = [
            'path' => 'files/',
            'filename' => $_FILES['file']['name'],
        ];

        // echo 'asd';
        // print_r($data);

        // echo 'sad';
        echo json_encode($data);
    }
?>