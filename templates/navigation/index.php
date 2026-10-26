<div class="wai-brand"><span class="wai-brand-mark" aria-hidden="true">⌖</span><strong>Whereami</strong><small>Les lieux qui nous réunissent</small></div>
<ul class="app-navigation wai-navigation">
<li><button type="button" id="showNewEventForm" class="primary wai-new"><span aria-hidden="true">＋</span> <?php p($l->t('New event')); ?></button></li>
<?php foreach (['showByEmployees' => ['♙', 'Employees'], 'showByLocations' => ['⌖', 'Locations'], 'showLastSeen' => ['◷', 'Last Seen'], 'showHRSummary' => ['▦', 'Summary'], 'showContracts' => ['▤', 'Contracts']] as $id => $entry): ?>
<li><button type="button" id="<?php p($id); ?>" class="wai-nav-item"><span aria-hidden="true"><?php p($entry[0]); ?></span><?php p($l->t($entry[1])); ?></button></li>
<?php endforeach; ?>
</ul>
<div class="wai-nav-footer"><button type="button" class="helper">Aide et fonctionnement</button><small>Whereami · v1.0.3</small></div>
