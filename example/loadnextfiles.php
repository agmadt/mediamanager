<?php 

    $data = [
        [
            'path' => 'files/',
            'filename' => 'unsplash-1.jpg',
        ],
        [
            'path' => 'files/',
            'filename' => 'unsplash-2.jpg',
        ],
        [
            'path' => 'files/',
            'filename' => 'unsplash-3.jpg',
        ],
        [
            'path' => 'files/',
            'filename' => 'unsplash-4.jpg',
        ],
        [
            'filetype' => 'image',
            'filename' => 'https://unsplash.it/300?random',
        ],
    ];

    echo json_encode($data);
?>