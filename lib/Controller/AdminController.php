<?php
namespace OCA\Whereami\Controller;

use Exception;
use OCP\IRequest;
use OCP\Files\IRootFolder;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\Response;
use OCP\AppFramework\Controller;
use OCP\IURLGenerator;
use OCP\IConfig;

class AdminController extends Controller {
	private $idNextcloud;
	
	/**
	 * Constructor
	 */
	public function __construct($AppName, 
								IRequest $request,
								IRootFolder $rootFolder,
								IURLGenerator $urlGenerator,
								IConfig $config){

		parent::__construct($AppName, $request);

		$this->idNextcloud = $UserId;
		$this->myDb = $myDb;
		$this->urlGenerator = $urlGenerator;
		$this->config = $config;
	}


	/**
	 * @AdminRequired
	 * @param string tags
	 */
	public function setTags(String $tags){

		return new Response(''. $tags);
	}
}
