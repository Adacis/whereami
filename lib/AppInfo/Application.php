<?php

//declare(strict_types=1);

namespace OCA\Whereami\AppInfo;

use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\AppFramework\Bootstrap\IBootContext;
// use OCP\Notification\IManager;

class Application extends App implements IBootstrap {
    public const APP_ID = 'whereami';

    public function __construct() {
        parent::__construct(self::APP_ID);
    }

    public function register(IRegistrationContext $context): void {

    }

    public function boot(IBootContext $context): void {
    }

}