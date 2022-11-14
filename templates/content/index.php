<div id="contentTable">
    <div class="breadcrumb">
        <div class="crumb svg crumbhome">
            <a href="" class="icon-home"></a>
            <span style="display: none;"></span>
        </div>
        <div class="crumb svg crumbhome">
            <span id="finalPath"><?php p($l->t('Employees')); ?></span>
        </div>
    </div>
    <h2>
        <center><?php p($l->t('Where am I ?')); ?></center>
    </h2>
    <p>
        <?php p($l->t('From')); ?>
        <input style="width: 200px;" id="dtStart" type="date" />
        <?php p($l->t('To')); ?>
        <input style="width: 200px;" id="dtEnd" type="date" />
        <button style="width: 200px;" class="setDates">
            <?php p($l->t('Set Dates')); ?>
        </button>

    </p>
    <div id="myapp">
    </div>
</div>