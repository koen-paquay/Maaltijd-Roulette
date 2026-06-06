/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Meal } from '../types';

export const DEFAULT_MEALS: Meal[] = [
  // Pasta (pasta)
  { id: 'p1', name: 'Spaghetti Bolognese met Rundergehakt', base: 'pasta', isVegetarian: false, notes: 'Klassieke Italiaanse favoriet met geraspte kaas' },
  { id: 'p2', name: 'Vegetarische Lasagne met Spinazie & Ricotta', base: 'pasta', isVegetarian: true, notes: 'Rijkgevulde lasagne met verse tomatensaus' },
  { id: 'p3', name: 'Penne met Romige Kip-Pesto & Broccoli', base: 'pasta', isVegetarian: false, notes: 'Met malse kippendijen en basilicumpesto' },
  { id: 'p4', name: 'Gnocchi met Tomatensaus en Mozzarella', base: 'pasta', isVegetarian: true, notes: 'Uit de oven met een krokante kaaslaag' },
  { id: 'p5', name: 'Macaroni en Kaas (Mac & Cheese) met Bloemkool', base: 'pasta', isVegetarian: true, notes: 'Lekker krokant uit de oven met verborgen groenten' },

  // Aardappels (aardappels)
  { id: 'a1', name: 'Stamppot Boerenkool met Rookworst', base: 'aardappels', isVegetarian: false, notes: 'Hollandse klassieker met jus en zuur' },
  { id: 'a2', name: 'Burgers met frites en een frisse salade', base: 'aardappels', isVegetarian: false, notes: 'Malse runder- of vegetarische burger met knapperige friet' },
  { id: 'a3', name: 'Aardappelgratin met Broccoli en Kaas', base: 'aardappels', isVegetarian: true, notes: 'Romige ovenschotel met een goudbruin korstje' },
  { id: 'a4', name: 'Gebakken Aardappeltjes met Kipschnitzel en Sla', base: 'aardappels', isVegetarian: false, notes: 'Lekker vlot met een frisse komkommersalade' },
  { id: 'a5', name: 'Hutspot met Vegetarische Gehaktballen', base: 'aardappels', isVegetarian: true, notes: 'Stamppot van wortel en ui met een lekkere vega bal' },

  // Rijst (rijst)
  { id: 'r1', name: 'Kip Curry met Rijst en Naanbrood', base: 'rijst', isVegetarian: false, notes: 'Zacht-pittige Indiase curry met malse kip' },
  { id: 'r2', name: 'Vega Pokebowl met Tofu en Avocado', base: 'rijst', isVegetarian: true, notes: 'Sushi-rijst met mango, avocado, zeewier en sushisaus' },
  { id: 'r3', name: 'Kip Tikka Masala met Rijst', base: 'rijst', isVegetarian: false, notes: 'In milde kruidige saus met sperziebonen' },
  { id: 'r4', name: 'Vegetarische Nasi Goreng met Satésaus', base: 'rijst', isVegetarian: true, notes: 'Gewokte rijst met prei, kool, gebakken ei en kroepoek' },
  { id: 'r5', name: 'Chili con Carne met Rijst en Zure Room', base: 'rijst', isVegetarian: false, notes: 'Mexicaanse stoofschotel met rode bonen en gehakt' },

  // Noedels (noedels)
  { id: 'n1', name: 'Thaise Noedels met wokgroenten en cashewnoten', base: 'noedels', isVegetarian: true, notes: 'Rijstnoedels met koriander, limoen en knapperige pinda\'s' },
  { id: 'n2', name: 'Bami Goreng met Saté en Atjar', base: 'noedels', isVegetarian: false, notes: 'Indonesische bami met malse kipsaté en pindasaus' },
  { id: 'n3', name: 'Ramen Noedelsoep met Shiitakes & Gekookt Ei', base: 'noedels', isVegetarian: true, notes: 'Rijke Japanse bouillon met verse groenten en sesam' },
  { id: 'n4', name: 'Teriyaki Beef Noedels met Paksoi', base: 'noedels', isVegetarian: false, notes: 'Snelroerbak met runderreepjes en zoete teriyakisaus' },
  { id: 'n5', name: 'Sesam-Pinda Noedels met Knapperige Spitskool', base: 'noedels', isVegetarian: true, notes: 'Met pinda-sesamsaus en krokante sjalotjes' },

  // Deeg (deeg)
  { id: 'd1', name: 'Pizza Margherita met Verse Basilicum', base: 'deeg', isVegetarian: true, notes: 'Klassieke dunne bodem met tomatensaus en mozzarella' },
  { id: 'd2', name: 'Traditionele Hollandse Pannenkoeken met Stroop', base: 'deeg', isVegetarian: true, notes: 'Heerlijk met appel, poedersuiker of stroop' },
  { id: 'd3', name: 'Hartige Quiche met Geitenkaas, Spinazie & Walnoot', base: 'deeg', isVegetarian: true, notes: 'Franse klassieke taart met krokante quichebodem' },
  { id: 'd4', name: 'Turkse Pizza (Lahmacun) met Falafel & Knoflook', base: 'deeg', isVegetarian: true, notes: 'Lekker gevuld met sla, tomaat, komkommer en knoflooksaus' },
  { id: 'd5', name: 'Focaccia uit de oven met Rozemarijn en Zeezout', base: 'deeg', isVegetarian: true, notes: 'Geserveerd met een olijfoliedip en rucola' },

  // Wraps (wraps)
  { id: 'w1', name: 'Mexicaanse Taco\'s met Kruidig Gehakt', base: 'wraps', isVegetarian: false, notes: 'Krokante tacoschelpen met mais, bonen en geraspte kaas' },
  { id: 'w2', name: 'Wraps met Krokante Kip en Honing-Mosterdsaus', base: 'wraps', isVegetarian: false, notes: 'Lekker vlot met krokante kipreepjes en frisse sla' },
  { id: 'w3', name: 'Romige Quesadilla\'s met Cheddar en Guacamole', base: 'wraps', isVegetarian: true, notes: 'Gebakken tortilla wraps gevuld met kaas, bosui en tomaat' },
  { id: 'w4', name: 'Wraps met Geroosterde Groenten en Hummus', base: 'wraps', isVegetarian: true, notes: 'Gevuld met paprika, courgette en gekruide kikkererwten' },
  { id: 'w5', name: 'Burrito\'s met Zwarte Bonen en Salsa', base: 'wraps', isVegetarian: true, notes: 'Mexicaans gerolde tortilla met rijst en guacamole' },

  // Soep (soep)
  { id: 's1', name: 'Verse Tomatensoep met brood en smeersels', base: 'soep', isVegetarian: true, notes: 'Klassieke rijke tomatensoep boordevol verse kruiden en soepstengels' },
  { id: 's2', name: 'Thaise Kippensoep (Tom Kha Gai)', base: 'soep', isVegetarian: false, notes: 'Met kokosmelk, champignons, koriander en citroengras' },
  { id: 's3', name: 'Rijke Pompoensoep met Kokos en Pompoenpitten', base: 'soep', isVegetarian: true, notes: 'Zacht, romig en perfect gekruid' },
  { id: 's4', name: 'Franse Uiensoep met Kaasgratincrouton', base: 'soep', isVegetarian: true, notes: 'Met gekaramelliseerde uien en sneetje stokbrood met gegratineerde gruyère' },
  { id: 's5', name: 'Stevige Snert (Erwtensoep) met Rookworst', base: 'soep', isVegetarian: false, notes: 'Traditionele Hollandse maaltijdsoep met roggebrood en katenspek' }
];
