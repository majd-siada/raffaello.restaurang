"""
Seed the public menu from the Raffaello Stekhus & Bar Swedish menu.
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from menu.models import Category, MenuItem


def D(value):
    return Decimal(str(value))


# Flat list of top-level categories with optional notes + items.
# order is assigned sequentially when seeding.
MENU_SEED = [
    {
        'name': 'Förrätter',
        'description': '',
        'items': [
            ('Vitlöksbröd', 'Mozzarellaost, aioli och körsbärstomater.', 99),
            ('Nduja', 'Surdegsbröd, italiensk salami och honung.', 99),
            ('Chèvre', 'Grillad chèvreost, honung och valnötter.', 109),
            ('Hot Chili Gamberi', 'Surdegsbröd, färsk basilika och aiolisås.', 109),
            ('Burrata', 'Pinjenötter, ruccola, körsbärstomater och färsk basilika.', 109),
            (
                'Ceviche på räkor',
                'Med avokado, lime, tropiska toner av mango & ananas. Toppad med krispiga risnudlar och en liten kick av chili.',
                119,
            ),
        ],
    },
    {
        'name': 'Varmrätter',
        'description': 'Allt kött är 300g.\nPommes kan bytas ut mot broccolipuré! Fråga personal.',
        'items': [
            ('Kycklingspett', 'Svensk kyckling, grillade grönsaker, klyftpotatis och svampsås.', 194),
            (
                'Gräddig souvas',
                'Picklad rödlök, rårörda lingon, sötpommes, västerbottensost, kantareller.',
                214,
            ),
            (
                'Grillad Fläskfilé',
                'Grillade grönsaker, klyftpotatis och pepparsås. Serveras med vitlökssmör.',
                229,
            ),
            (
                'Lammracks',
                'Svenskt kött. Serveras med kappa, med klyftpotatis, ugnsrostade körsbärstomater, grillade grönsaker och rödvinssås.',
                299,
            ),
            (
                'Pepparstek (Grillad)',
                'Ryggbiff, grillade grönsaker, pommes och pepparsås. Serveras med vitlökssmör.',
                324,
            ),
            (
                'Grillade Entrecôte',
                'Grillade grönsaker, pommes, bearnaisesås. Serveras med vitlökssmör.',
                349,
            ),
            (
                'Raffaello Special',
                'Grillade oxfilé och grönsaker, sötpotatis och bearnaisesås. Serveras med vitlökssmör.',
                369,
            ),
            (
                'Renytterfilé',
                'Serveras med klyftpotatis, sparris, bacon, grillade körsbärstomater och rödvinssås.',
                349,
            ),
        ],
    },
    {
        'name': 'Fisk',
        'description': '',
        'items': [
            ('Fish & Chips', 'Krispig torsk, gröna ärtor, citron, pommes och remouladsås.', 169),
            (
                'Fjällrödingfilé',
                'Serveras med ugnsrostad potatis, grillade grönsaker och Raffaellosås.',
                289,
            ),
        ],
    },
    {
        'name': 'Pasta',
        'description': 'Innehåller gräddsås, ruccola och parmesanost.',
        'items': [
            ('Kycklingpasta', 'Currysås och kyckling.', 149),
            (
                'Arabiathapasta',
                'Salami, krämig chilisås, penne, ruccola och vitlök, nyriven parmesanost.',
                149,
            ),
            ('Carbonara', 'Bacon, lök, ägg.', 165),
            (
                'Raffaello Pasta',
                'Limesås, varmrökt lax, handskalade räkor, vitlök, citron och dill.',
                175,
            ),
            ('Oxfilépasta', 'Oxfilébitar, champinjoner och gorgonzola.', 175),
        ],
    },
    {
        'name': 'Hamburgare',
        'description': '',
        'items': [
            (
                'Cheeseburgare (Högrev 200g)',
                'Hamburgardressing, sallad, cheddarost och pommes.',
                149,
            ),
            (
                'Baconburgare (Högrev 200g)',
                'Dijonmajonnäs, krispigt bacon, sallad, picklad rödlök, tomat, cheddarost och pommes.',
                165,
            ),
            (
                'Raffaelloburgare Wagyu Beef 150g',
                'Tryffelmayo, cheddarost, bifftomat, krispig sallad och sötpotatis.',
                169,
            ),
            (
                'Älgburgare',
                '200 g saftig burgare på svenskt älgkött, serverad i rostat briochebröd med lagrad cheddarost, tryffelmajonnäs, picklad rödlök, krispig sallad, tomat och rårörda lingon. Serveras med pommes frites.',
                199,
            ),
        ],
    },
    {
        'name': 'Pizza Classic',
        'description': 'Alla innehåller tomatsås och mozzarellaost.',
        'items': [
            ('Pizza Margherita', 'Ost', 125),
            ('Vesuvio', 'Skinka.', 125),
            ('Hawaii', 'Skinka och ananas.', 125),
            ('Capricciosa', 'Skinka och champinjoner.', 125),
            ('Kycklingpizza', 'Kyckling, tomat, curry och orientdressing.', 139),
            ('Kebabpizza', 'Kebabkött, tomat, lök och orientdressing.', 139),
            (
                'Turkisk Kebabpizza',
                'Kebabkött, lök, tomat, gurka, pepperoni, kebabsås och sallad.',
                145,
            ),
        ],
    },
    {
        'name': 'Deluxe Pizza',
        'description': 'Innehåller mozzarella, ruccola, körsbärstomater, färsk basilika och parmesanost.',
        'items': [
            ('Ndjuja', 'Italisk salami', 149),
            ('Arabiata pizza', 'Salami, vitlök, stark.', 149),
            ('Parma Pizza', 'Parmaskinka och pinjenötter.', 149),
            (
                'Pizza Raffaello',
                'Stekt oxfilé, champinjoner, gorgonzola och bearnaisesås.',
                165,
            ),
            (
                'Carpaccio Pizza',
                'Oxcarpaccio, parmesan, citronskiva, ruccola och Bearnaisesås.',
                169,
            ),
            (
                'Chili Gamberi Pizza',
                'Vitlöksmarinerade gambasräkor, chili, jalapeño och citron.',
                169,
            ),
        ],
    },
    {
        'name': 'Vegetariskt',
        'description': '',
        'items': [
            (
                'Halloumiburgare',
                'Tryffelmajo, stekt halloumi, sallad, tomat, lök och pommes.',
                149,
            ),
            (
                'Kantarellpasta',
                'Stekta kantareller, vitlök, champinjoner och tryffelolja.',
                149,
            ),
            ('Chèvre-pizza', 'Chèvreost, päron, valnötter och honung.', 155),
        ],
    },
    {
        'name': 'Barnmeny',
        'description': 'Festis ingår till alla måltider.',
        'items': [
            ('Pannkakor', 'Serveras med sylt och grädde.', 99),
            ('Nuggets', 'Pommes, 6 st nuggets med valfri dressing.', 99),
            (
                'Cheeseburgare (Kött 90g)',
                'Hamburgardressing, tomat, sallad och cheddarost.',
                99,
            ),
            ('Kids Entrecôte', 'Liten entrecôte med pommes och bearnaisesås.', 149),
        ],
    },
    {
        'name': 'Sallad',
        'description': '',
        'items': [
            (
                'Burratasallad',
                'Burrata, tomater, ruccola, basilikaolja, parmesanost och balsamico.',
                149,
            ),
            (
                'Caesarsallad',
                'Välj mellan kyckling och halloumi. Krispigt bacon, krutonger, körsbärstomater, romansallad och parmesanost.',
                159,
            ),
            (
                'Räksallad',
                'Handskalade räkor, kokt ägg, körsbärstomater, citron, västerbottensost och aioli.',
                175,
            ),
        ],
    },
    {
        'name': 'Efterrätter',
        'description': '',
        'items': [
            ('Glasskula', 'Fråga personalen om kvällens smaker.', 45),
            ('Kladdkaka', 'Med vispgrädde.', 69),
            ('Citron-cheesecake', '', 69),
            ('Crème Brûlée', '', 109),
        ],
    },
    {
        'name': 'Tillbehör',
        'description': '',
        'items': [
            ('Pommes frites', '', 25),
            ('Pizzasallad', '', 29),
            ('Klyftpotatis', '', 30),
            ('Sötpotatis frites', '', 35),
            ('6 st Lökringar', '', 40),
            ('6 st Mozzarella', '', 50),
            ('6 st Nuggets', '', 50),
            ('6 st Chili cheese', '', 50),
        ],
    },
    {
        'name': 'Snacks',
        'description': '',
        'items': [
            ('Chips', '', 29),
            ('Blandade nötter', '', 35),
            ('Tryffelchips', '', 45),
        ],
    },
    {
        'name': 'Dressing',
        'description': '',
        'items': [
            ('Bearnaisesås', '', 20),
            ('Orientdressing', '', 20),
            ('Hamburgerdressing', '', 20),
            ('Starksås', '', 20),
            ('Smältost', '', 25),
            ('Tryffelmajo', '', 25),
            ('Aioli', '', 25),
            ('Pepparsås', '', 29),
        ],
    },
    {
        'name': 'Alkoholfri',
        'description': '',
        'items': [
            ('Raffaello special', 'Sprite, citron, passionfrukt och ananasjuice.', 79),
            ('Virgin Sprite Mojito', 'Lime, mynta och soda.', 79),
            ('Mariastad .33cl', '', 49),
            ('Priska Päron .33cl', '', 49),
            ('Röd/Vit-vin alkoholfri', '', 65),
        ],
    },
    {
        'name': 'Öl',
        'description': 'Alla öl 85 SEK om inte annat anges.',
        'items': [
            ('Norrlandsguld (50cl)', '', 85),
            ('Mariastad (50cl)', '', 85),
            ('Höga Kusten (50cl)', '', 85),
            ('Eriksberg (50cl)', '', 85),
            ('IPA', '', 85),
        ],
    },
    {
        'name': 'Ölfat',
        'description': 'Alla ölfat 79 SEK.',
        'items': [
            ('Höga Kusten (40cl)', '', 79),
            ('Sofiero öl (40cl)', '', 79),
            ('Raffaello öl (40cl)', 'Merke', 79),
        ],
    },
    {
        'name': 'Läsk',
        'description': 'Alla läsk 30 SEK.',
        'items': [
            (
                'Coca Cola, Coca Cola Zero, Fanta, Sprite, Pepsi Max, Trocadero, Trocadero Zero, Loka',
                '',
                30,
            ),
        ],
    },
    {
        'name': 'Kaffe & Te',
        'description': '',
        'items': [
            ('Kaffe & Te', '', 30),
            ('Espresso', '', 40),
            ('Cappuccino', '', 59),
            ('Ice Americano', '', 69),
            ('Ice Latte', '', 69),
        ],
    },
    {
        'name': 'Cider',
        'description': 'Alla cider 79 SEK.',
        'items': [
            ('Briska Päron', '', 79),
            ('Briska Hallon', '', 79),
        ],
    },
    {
        'name': 'Cocktails',
        'description': '(4cl) 110 SEK · (6cl) 135 SEK',
        'items': [
            ('Espresso Martini', 'Vodka, Kahlúa, espresso och kaffebönor. Pris: (4cl) 110 SEK / (6cl) 135 SEK', 110),
            ('Whiskey Sour', 'Bourbon whiskey, citron och sockerlag. Pris: (4cl) 110 SEK / (6cl) 135 SEK', 110),
            ('Old Fashioned', 'Bourbon, bitters och apelsinzest. Pris: (4cl) 110 SEK / (6cl) 135 SEK', 110),
            ('Mojito', 'Rom, mynta, lime och soda. Pris: (4cl) 110 SEK / (6cl) 135 SEK', 110),
            ('Aperol Spritz', 'Aperol, prosecco och soda. Pris: (4cl) 110 SEK / (6cl) 135 SEK', 110),
            ('Negroni', 'Gin, Campari och vermouth. Pris: (4cl) 110 SEK / (6cl) 135 SEK', 110),
            (
                'Pornstar Martini',
                'Vaniljvodka, passionsfrukt och prosecco. Pris: (4cl) 110 SEK / (6cl) 135 SEK',
                110,
            ),
            ('Strawberry Daiquiri', 'Rom, jordgubbar och lime. Pris: (4cl) 110 SEK / (6cl) 135 SEK', 110),
        ],
    },
    {
        'name': 'Signature cocktails',
        'description': '(4cl) 110 SEK · (6cl) 135 SEK',
        'items': [
            (
                'Raffaello Gold',
                'Passionsfrukt, vodka, lime och gold dust. Pris: (4cl) 110 SEK / (6cl) 135 SEK',
                110,
            ),
            ('Arctic Berry', 'Gin, nordiska bär och tonic. Pris: (4cl) 110 SEK / (6cl) 135 SEK', 110),
            (
                'Smokey Boulevard',
                'Whiskey, bitters och rökt apelsin. Pris: (4cl) 110 SEK / (6cl) 135 SEK',
                110,
            ),
        ],
    },
    {
        'name': 'Röda viner',
        'description': 'Rekommenderade Vin- & Matkombinationer.',
        'items': [
            (
                'Husets röd',
                'Umani Ronchi (Från Italien), Farmers Market (Från Italien).\nEn flaska 275 SEK.',
                99,
            ),
            (
                'Amarone & Ripasso',
                'En flaska 399 SEK.\nPassar perfekt till: Steakhouse Signatures: Raffaello Special (oxfilé med tryffelsås), Entrecôte 300g (med bearnaise) och Pepper Steak.',
                139,
            ),
            (
                'Cabernet Sauvignon',
                'En flaska 339 SEK.\nPassar perfekt till: Burgare & Signatures: Rydberg på Raffaello, Truffle Burger och Bacon Deluxe Burger.\nVarför: Vinets kraftiga struktur och strävhet balanserar fettet och de grillade tonerna i burgarna och nötköttet utmärkt.',
                119,
            ),
            (
                'Pinot Noir',
                'En flaska 299 SEK.\nPassar perfekt till: Kyckling & Pasta: Crispy Chicken Burger, Oxfilépasta samt lättare kötträtter. Pizza: Carpaccio Pizza.\nVarför: Ett elegant och bärigt rött vin som inte dominerar över ljusare kött, svamp eller krämiga pastarätter.',
                109,
            ),
        ],
    },
    {
        'name': 'Vita viner',
        'description': 'Rekommenderade Vin- & Matkombinationer.',
        'items': [
            (
                'Husets vit',
                'Umani Ronchi (Från Italien).\nEn flaska 275 SEK.',
                99,
            ),
            (
                'Chardonnay',
                'En flaska 339 SEK.\nPassar perfekt till: Fisk & Skaldjur: Halstrad Röding och Fish & Chips Deluxe.\nVarför: Chardonnays fylliga karaktär harmonierar med stekt/grillad fisk och rika tillbehör som remoulad eller brynt smör.',
                119,
            ),
            (
                'Sauvignon Blanc & Riesling',
                'En flaska 299 SEK.\nPassar perfekt till: Förrätter: Räktartar och Ceviche på räkor.\nVarför: Frisk syra och citruslyft lyfter skaldjuren. Riesling klarar även chilihetta väl.',
                109,
            ),
            (
                'Pinot Grigio',
                'En flaska 299 SEK.\nPassar perfekt till: Pasta & Pizza: Carbonara, Burrata Pizza och Vegetarisk Pizza.\nVarför: Ett friskt, lätt vin som balanserar salt chark och skär igenom krämiga ostar.',
                109,
            ),
        ],
    },
    {
        'name': 'Roséviner',
        'description': 'Rekommenderade Vin- & Matkombinationer.',
        'items': [
            (
                'Whispering Angel & Husets Rosé',
                'En flaska 275 SEK.\nPassar perfekt till: Pizza & Förrätter: Burrata Pizza, Parma Pizza, Räktartar samt lättare plockmat.\nVarför: En torr, frisk och elegant rosé som är mångsidig och lyfter krämiga ostar och lufttorkad skinka.',
                99,
            ),
        ],
    },
    {
        'name': 'Mousserande',
        'description': 'Rekommenderade Vin- & Matkombinationer.',
        'items': [
            (
                'Champagne & Prosecco',
                'En flaska 275 SEK.\nPassar perfekt till: Aperitif & Förrätter: Perfekt som välkomstdrink eller till räktartar och ceviche.\nVarför: Bubblorna rensar gommen och ger en festlig, lyxig känsla till förrätter.',
                99,
            ),
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed Swedish Raffaello menu categories and items from the restaurant menu.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--replace',
            action='store_true',
            help='Delete all existing categories and items before seeding.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['replace']:
            deleted_items, _ = MenuItem.objects.all().delete()
            deleted_cats, _ = Category.objects.all().delete()
            self.stdout.write(
                self.style.WARNING(
                    f'Removed existing menu data ({deleted_cats} categories, {deleted_items} items).'
                )
            )

        cat_count = 0
        item_count = 0

        for cat_order, cat_data in enumerate(MENU_SEED):
            category = Category.objects.create(
                name=cat_data['name'],
                description=cat_data.get('description') or '',
                order=cat_order,
                parent=None,
            )
            cat_count += 1

            for item_order, (name, description, price) in enumerate(cat_data['items']):
                MenuItem.objects.create(
                    category=category,
                    name=name,
                    description=description or '',
                    price=D(price),
                    is_available=True,
                    order=item_order,
                )
                item_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded {cat_count} categories and {item_count} menu items.'
            )
        )
