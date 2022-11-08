<div id="contentTable">
    <div class="breadcrumb">
        <div class="crumb svg crumbhome">
            <a href="#" class="icon-home"></a>
            <span style="display: none;"></span>
        </div>
        <div class="crumb svg crumbhome">
            <span><?php p($l->t('Home')); ?></span>
        </div>
        <div class="crumb svg crumbhome">
            <span><?php p($l->t('HR')); ?></span>
        </div>
    </div>

    <h2>
        <center><?php p($l->t('Employees working places summary')); ?></center>
    </h2>
    <p>
        <?php p($l->t('From')); ?>
        <input style="width: 200px;" id="dtStart" type="date" />
        <?php p($l->t('To')); ?><input style="width: 200px;" id="dtEnd" type="date" />
        <button style="width: 200px;" class="showHRsummary">
            <?php p($l->t('Summary')); ?>
        </button>
        <button style="width: 200px;" class="lastSeen">
            <?php p($l->t('Last seen')); ?>
        </button>
    </p>
    <div id="myapp">
    </div>
</div>