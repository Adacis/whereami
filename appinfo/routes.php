<?php
return [
    'routes' => [
        ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
        ['name' => 'page#quotes', 'url' => '/quotes', 'verb' => 'GET'],

        ['name' => 'page#getLastSeen', 'url' => '/getLastSeen', 'verb' => 'POST'],
        ['name' => 'page#getEvents', 'url' => '/getEvents', 'verb' => 'POST'],
        ['name' => 'page#getIcons', 'url' => '/getIcons', 'verb' => 'POST'],
        ['name' => 'page#getContracts', 'url' => '/getContracts', 'verb' => 'POST'],
        ['name' => 'page#getCalendarsForUser', 'url' => '/getCalendars', 'verb' => 'GET'],
        ['name' => 'page#isTimeSlotAvailable', 'url' => '/isTimeSlotAvailable', 'verb' => 'POST'],
        ['name' => 'admin#setTags', 'url' => '/setTags', 'verb' => 'POST'],
        ['name' => 'admin#deleteTag', 'url' => '/deleteTag', 'verb' => 'POST'],
        ['name' => 'admin#getTags', 'url' => '/getTags', 'verb' => 'POST'],
        ['name' => 'admin#setIcon', 'url' => '/setIcon', 'verb' => 'POST'],
        ['name' => 'admin#changeIcon', 'url' => '/changeIcon', 'verb' => 'POST'],
        ['name' => 'admin#changeLabel', 'url' => '/changeLabel', 'verb' => 'POST'],
        ['name' => 'admin#deleteIcon', 'url' => '/deleteIcon', 'verb' => 'POST'],
        ['name' => 'admin#getAllIcons', 'url' => '/getAllIcons', 'verb' => 'GET'],
    ]
];
