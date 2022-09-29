<?php
namespace OCA\Whereami\Controller;

use OCA\Whereami\Db\Bdd;
use OCP\IRequest;
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
								IURLGenerator $urlGenerator,
								IConfig $config,
								Bdd $myDb){

		parent::__construct($AppName, $request);

		$this->myDb = $myDb;
		$this->urlGenerator = $urlGenerator;
		$this->config = $config;
	}


	/**
	 * @AdminRequired
	 * @param string tag	 
	 */
	public function setTags(String $tag){
		$splitted = explode(':', $tag);
		$this->myDb->insertWordInWordList($splitted[1], $splitted[0]);
		return new DataResponse($tag, 200, ['Content-Type' => 'application/json']);
	}


	/**
	 * @AdminRequired
	 * @param string tag
	 */
	public function deleteTag(String $tag) {
		$splitted = explode(':', $tag);
		$this->myDb->deleteWordInWordList($splitted[1], $splitted[0]);
		return new DataResponse($tag, 200, ['Content-Type' => 'application/json']);
	}

	/**
	 * @AdminRequired
	 * @param string usage
	 */
	public function getTags(String $usage) {
		$data = $this->myDb->getWordInWordList($usage);
		return new DataResponse($data, 200, ['Content-Type' => 'application/json']);
	}
}
