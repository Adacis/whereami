<?php
return [
    'routes' => [
        ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
        ['name' => 'page#quotes', 'url' => '/quotes', 'verb' => 'GET'],
        ['name' => 'page#getLastSeen', 'url' => '/getLastSeen', 'verb' => 'POST'],
        ['name' => 'page#getEvents', 'url' => '/getEvents', 'verb' => 'POST'],
        ['name' => 'admin#setTags', 'url' => '/setTags', 'verb' => 'POST'],
        ['name' => 'admin#deleteTag', 'url' => '/deleteTag', 'verb' => 'POST'],
        ['name' => 'admin#getTags', 'url' => '/getTags', 'verb' => 'POST'],
    ]
];
