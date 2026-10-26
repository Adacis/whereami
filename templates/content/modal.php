<div id="helper" class="modal" role="dialog" aria-modal="true" aria-labelledby="wai-help-title" tabindex="-1">
    <div class="modal-content">
        <header class="wai-dialog-header">
            <div><p class="wai-eyebrow">LE GUIDE WHEREAMI</p><h2 id="wai-help-title">Aide et fonctionnement</h2><p>Comprendre les présences, les lieux et les bilans de l’équipe.</p></div>
            <button type="button" class="modalClose" aria-label="Fermer l’aide">×</button>
        </header>
        <div class="wai-help-body">
            <p class="wai-help-intro">Whereami lit les événements de vos calendriers accessibles dont le titre commence par <strong>@</strong>. Les lieux et types d’absence doivent faire partie de la liste configurée par votre administrateur. Les tableaux de présence affichent les jours du lundi au vendredi.</p>
            <nav aria-label="Sommaire de l’aide"><a href="#help-calendar">Écrire un événement</a> · <a href="#help-new">New event</a> · <a href="#help-employees">Employees</a> · <a href="#help-locations">Locations</a> · <a href="#help-seen">Last seen</a> · <a href="#help-summary">Summary</a> · <a href="#help-contracts">Contracts</a></nav>
            <section id="help-calendar">
                <h3>01 · Écrire un événement dans le calendrier</h3>
                <p>Créez un événement <strong>sur toute la journée</strong>. Le premier lieu précédé de <strong>@</strong> correspond au matin ; le deuxième, s’il existe, à l’après-midi. Avec un seul lieu, il s’applique aux deux demi-journées.</p>
                <p><code>@Cenon</code> : à Cenon toute la journée.</p>
                <p><code>@Déplacement, @Cenon, D26010</code> :</p>
                <div class="wai-help-example"><div><small>MATIN · premier @</small><strong>Déplacement</strong></div><div><small>APRÈS-MIDI · deuxième @</small><strong>Cenon</strong></div></div>
                <p><code>D26010</code> est une référence de devis, pas un troisième lieu. Les éléments après les lieux, séparés par des virgules, peuvent aussi servir de commentaire. Pour le télétravail, les RTT et les congés, utilisez les libellés configurés, par exemple <code>@Télétravail</code> ou <code>@Congés</code>.</p>
            </section>
            <section id="help-new">
                <h3>02 · New event — déclarer une présence</h3>
                <ol><li>Cliquez sur <strong>New event</strong> dans la navigation.</li><li>Choisissez les dates de début et de fin, puis le calendrier si plusieurs sont disponibles.</li><li>Sélectionnez votre lieu. Cochez <strong>half day</strong> pour choisir séparément le matin et l’après-midi.</li><li>Ajoutez une description si nécessaire, puis cliquez sur <strong>Créer</strong>.</li></ol>
                <p>Le formulaire signale les conflits de dates. Pour une période de plusieurs jours, il crée les événements en excluant les week-ends. Les dates de début et de fin choisies sont incluses. Pour modifier ou supprimer une présence existante, ouvrez son événement dans Calendrier, puis appliquez à nouveau la période dans Whereami.</p>
            </section>
            <section id="help-employees">
                <h3>03 · Employees — les présences par personne</h3>
                <p>Une ligne par collaborateur, une colonne par date. Les deux lieux d’une journée sont affichés dans l’ordre <strong>matin, puis après-midi</strong>. Un seul lieu vaut pour toute la journée ; <strong>—</strong> signifie qu’aucune présence n’a été renseignée.</p>
                <p>Les colonnes <strong>Personne</strong> et <strong>Clés</strong> restent fixes lorsque vous faites défiler les dates. Les clés indiquent les lieux auxquels la personne a accès ; cliquez sur une clé pour retrouver le lieu dans Locations. Survolez une présence pour lire son commentaire.</p>
            </section>
            <section id="help-locations">
                <h3>04 · Locations — les effectifs par demi-journée</h3>
                <p>Une ligne par lieu ou type d’absence. Chaque date est toujours divisée en deux : <strong>Matin à gauche</strong>, <strong>Après-midi à droite</strong>, même quand les deux nombres sont identiques.</p>
                <p>Avec <code>@Cenon</code>, la personne compte une fois le matin et une fois l’après-midi à Cenon. Avec <code>@Déplacement, @Cenon</code>, elle compte le matin en Déplacement et l’après-midi à Cenon.</p>
                <p>Survolez un nombre pour afficher les collaborateurs concernés. <strong>0</strong> signifie qu’aucune personne n’est déclarée sur ce lieu pour cette demi-journée. La couleur ambre indique une présence sans détenteur de clés identifié pour un lieu où les clés sont suivies.</p>
                <p>La ligne <strong>Total</strong> additionne séparément les effectifs du matin et de l’après-midi, y compris les absences et le télétravail : ce n’est pas le total des personnes présentes au bureau. Ne cumulez pas les deux nombres pour compter des personnes uniques.</p>
            </section>
            <section id="help-seen">
                <h3>05 · Last seen — qui s’est croisé ?</h3>
                <p>Chaque case compare deux collaborateurs et indique leur dernière date de présence commune, pendant la même demi-journée et sur le même lieu. Seuls <strong>Cenon, Bordeaux et DNUM</strong> sont pris en compte ; congés, RTT, télétravail et autres lieux sont exclus.</p>
                <p>L’icône <strong>◷</strong> signifie qu’aucun croisement n’a été trouvé sur la période choisie. Le tiret sur la diagonale correspond à une personne comparée à elle-même. Survolez une date pour connaître le lieu et la durée cumulée en jours communs. Ces indications reflètent les calendriers renseignés.</p>
            </section>
            <section id="help-summary">
                <h3>06 · Summary — le bilan du mois</h3>
                <p>Choisissez un <strong>mois</strong> et une <strong>année</strong> ; les flèches passent au mois précédent ou suivant. RTT, télétravail et congés sont affichés en priorité, en nombre de jours ouvrés : une journée vaut <strong>1</strong>, une demi-journée vaut <strong>0,5</strong>.</p>
                <p>Ouvrez <strong>Colonnes additionnelles</strong> et cochez les autres lieux ou le total souhaités. Survolez un nombre pour voir les dates concernées. Les week-ends sont exclus ; les jours fériés ne sont pas déduits automatiquement.</p>
            </section>
            <section id="help-contracts">
                <h3>07 · Contracts — consulter un devis</h3>
                <p>Choisissez une période, cliquez sur <strong>Appliquer</strong>, puis sélectionnez le <strong>devis</strong>. Le tableau affiche uniquement les collaborateurs ayant imputé sur ce devis, les jours calculés, les dates et le total.</p>
                <p>Les références de type <code>D26010</code> sont repérées dans les titres des événements de calendrier. Seuls les devis trouvés sur la période sont proposés. Les jours affichés sont calculés à partir de la durée de ces événements ; ce tableau n’est pas une saisie manuelle de temps.</p>
            </section>
            <section>
                <h3>08 · Filtrer et parcourir les tableaux</h3>
                <p>Dans Employees, Locations, Last seen et Contracts, choisissez les dates <strong>Du</strong> et <strong>au</strong>, puis cliquez sur <strong>Appliquer</strong>. Summary utilise son propre sélecteur mensuel.</p>
                <p>Lorsqu’un champ de recherche est affiché, saisissez un nom ou un lieu pour filtrer les lignes. Cliquez sur un en-tête avec des flèches pour trier. Sur une petite fenêtre, faites défiler horizontalement les dates ; les colonnes d’identification restent visibles.</p>
            </section>
        </div>
        <footer class="wai-help-footer"><button type="button" class="modalClose">Fermer le guide</button></footer>
    </div>
</div>
