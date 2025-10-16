package com.onlycoffee.app.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import kotlinx.serialization.Serializable

@Parcelize
@Serializable
data class MenuItem(
    val id: String,
    val name: String,
    val description: String,
    val basePrice: Double,
    val imageUrl: String? = null,
    val category: MenuCategory,
    val isAvailable: Boolean = true,
    val modifiers: List<MenuModifier> = emptyList(),
    val nutritionInfo: NutritionInfo? = null,
    val allergens: List<String> = emptyList(),
    val preparationTime: Int = 5, // minutes
    val isCustomizable: Boolean = true,
    val isFeatured: Boolean = false,
    val isPopular: Boolean = false
) : Parcelable {

    val formattedPrice: String
        get() = "$${String.format("%.2f", basePrice)}"

    val calories: Int?
        get() = nutritionInfo?.calories
    
    companion object {
        val sampleItems = listOf(
            // ESPRESSO CATEGORY
            MenuItem(
                id = "espresso",
                name = "Espresso",
                description = "Rich, concentrated coffee shot with perfect crema",
                basePrice = 4.50,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.VIENNA_CLASSICS,
                isAvailable = true,
                preparationTime = 3,
                isPopular = true,
                allergens = listOf("G")
            ),
            MenuItem(
                id = "doppio",
                name = "Doppio",
                description = "Double shot of our premium espresso",
                basePrice = 5.50,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.VIENNA_CLASSICS,
                isAvailable = true,
                preparationTime = 3,
                allergens = listOf("G")
            ),
            MenuItem(
                id = "americano",
                name = "Americano",
                description = "Rich espresso shots with hot water, perfect for coffee purists",
                basePrice = 5.50,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.VIENNA_CLASSICS,
                isAvailable = true,
                preparationTime = 4,
                isPopular = true,
                allergens = listOf("G")
            ),
            MenuItem(
                id = "cappuccino",
                name = "Cappuccino",
                description = "Perfect balance of espresso, steamed milk, and foam",
                basePrice = 6.50,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.VIENNA_CLASSICS,
                isAvailable = true,
                preparationTime = 5,
                isPopular = true,
                allergens = listOf("G"),
                modifiers = listOf(
                    MenuModifier(
                        id = "milk",
                        name = "Milk Choice",
                        type = ModifierType.SINGLE_SELECT,
                        isRequired = false,
                        options = listOf(
                            ModifierOption("whole", "Whole Milk", 0.0),
                            ModifierOption("oat", "Oatly Hafer Milk", 0.75),
                            ModifierOption("soy", "Soy Milk", 0.75),
                            ModifierOption("coconut", "Coconut Milk", 0.75),
                            ModifierOption("lactose-free", "Lactose-Free Milk", 0.75)
                        )
                    )
                )
            ),
            MenuItem(
                id = "flat-white",
                name = "Flat White",
                description = "Smooth espresso with perfectly steamed milk",
                basePrice = 6.50,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.VIENNA_CLASSICS,
                isAvailable = true,
                preparationTime = 5,
                allergens = listOf("G"),
                modifiers = listOf(
                    MenuModifier(
                        id = "milk",
                        name = "Milk Choice",
                        type = ModifierType.SINGLE_SELECT,
                        isRequired = false,
                        options = listOf(
                            ModifierOption("whole", "Whole Milk", 0.0),
                            ModifierOption("oat", "Oatly Hafer Milk", 0.75),
                            ModifierOption("soy", "Soy Milk", 0.75),
                            ModifierOption("coconut", "Coconut Milk", 0.75),
                            ModifierOption("lactose-free", "Lactose-Free Milk", 0.75)
                        )
                    )
                )
            ),
            MenuItem(
                id = "test-coffee",
                name = "Test Coffee",
                description = "This is a test coffee to verify our changes are working",
                basePrice = 9.99,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.VIENNA_CLASSICS,
                isAvailable = true,
                preparationTime = 5,
                isPopular = true,
                allergens = listOf("G")
            ),
            MenuItem(
                id = "macchiato",
                name = "Macchiato",
                description = "Espresso 'marked' with a dollop of foamed milk",
                basePrice = 6.50,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.VIENNA_CLASSICS,
                isAvailable = true,
                preparationTime = 4,
                allergens = listOf("G")
            ),
            MenuItem(
                id = "cortado",
                name = "Cortado",
                description = "Equal parts espresso and warm milk, perfectly balanced",
                basePrice = 6.50,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.VIENNA_CLASSICS,
                isAvailable = true,
                preparationTime = 5,
                allergens = listOf("G")
            ),
            MenuItem(
                id = "einspanner",
                name = "Einspänner",
                description = "Double espresso with whipped cream (FG)",
                basePrice = 7.00,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.VIENNA_CLASSICS,
                isAvailable = true,
                preparationTime = 6,
                allergens = listOf("F", "G")
            ),
            MenuItem(
                id = "latte",
                name = "Iced Vanilla Protein Latte",
                description = "With 29g of protein per grande, this handcrafted Iced Latte blends bold, signature espresso with Protein-boosted Milk and sweet vanilla flavor for a smooth, delicious beverage.",
                basePrice = 6.00,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.VIENNA_CLASSICS,
                isAvailable = true,
                preparationTime = 5,
                isPopular = true,
                allergens = listOf("G"),
                nutritionInfo = NutritionInfo(
                    calories = 270,
                    fat = 4.0,
                    saturatedFat = 2.5,
                    cholesterol = 15,
                    sodium = 180,
                    carbohydrates = 23.0,
                    fiber = 0.0,
                    sugar = 23.0,
                    protein = 29.0,
                    caffeine = 150
                ),
                modifiers = listOf(
                    MenuModifier(
                        id = "ice",
                        name = "Add-ins",
                        type = ModifierType.SINGLE_SELECT,
                        isRequired = false,
                        options = listOf(
                            ModifierOption("ice", "Ice", 0.0),
                            ModifierOption("no-ice", "No Ice", 0.0)
                        )
                    ),
                    MenuModifier(
                        id = "espresso",
                        name = "Espresso & Shot Options",
                        type = ModifierType.QUANTITY,
                        isRequired = false,
                        options = listOf(
                            ModifierOption("shots", "2 Shots", 0.0)
                        )
                    ),
                    MenuModifier(
                        id = "espresso-type",
                        name = "Espresso & Shot Options",
                        type = ModifierType.SINGLE_SELECT,
                        isRequired = false,
                        options = listOf(
                            ModifierOption("signature", "Signature Espresso", 0.0),
                            ModifierOption("decaf", "Decaf Espresso", 0.0),
                            ModifierOption("half-caff", "1/2 Caff Espresso", 0.0)
                        )
                    ),
                    MenuModifier(
                        id = "flavors",
                        name = "Flavors",
                        type = ModifierType.QUANTITY,
                        isRequired = false,
                        options = listOf(
                            ModifierOption("vanilla", "4 Pump(s) Vanilla Syrup", 0.0)
                        )
                    )
                )
            ),
            MenuItem(
                id = "thomas-coffee-latte",
                name = "Thomas Coffee Latte",
                description = "Latte with double espresso (FG)",
                basePrice = 7.25,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.VIENNA_CLASSICS,
                isAvailable = true,
                preparationTime = 6,
                isFeatured = true,
                allergens = listOf("F", "G")
            ),

            // SPECIALTY / ETHIOPIA CATEGORY
            MenuItem(
                id = "ethiopia-doppio",
                name = "Ethiopia Doppio",
                description = "Premium Ethiopian coffee beans, double shot",
                basePrice = 6.50,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.SPECIALTY_ETHIOPIA,
                isAvailable = true,
                preparationTime = 4,
                isFeatured = true,
                allergens = listOf("G")
            ),
            MenuItem(
                id = "ethiopia-flat-white",
                name = "Ethiopia Flat White",
                description = "Ethiopian coffee with perfectly steamed milk",
                basePrice = 7.75,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.SPECIALTY_ETHIOPIA,
                isAvailable = true,
                preparationTime = 6,
                allergens = listOf("G")
            ),
            MenuItem(
                id = "brewed-coffee-small",
                name = "Brewed Coffee — Small",
                description = "Freshly brewed Ethiopian coffee, small size",
                basePrice = 4.75,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.SPECIALTY_ETHIOPIA,
                isAvailable = true,
                preparationTime = 2,
                isPopular = true
            ),
            MenuItem(
                id = "brewed-coffee-large",
                name = "Brewed Coffee — Large",
                description = "Freshly brewed Ethiopian coffee, large size",
                basePrice = 6.00,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.SPECIALTY_ETHIOPIA,
                isAvailable = true,
                preparationTime = 2,
                isPopular = true
            ),
            MenuItem(
                id = "king-kong-coldbrew",
                name = "King Kong Coldbrew — Large",
                description = "Smooth, strong cold brew coffee",
                basePrice = 6.50,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.SUMMER_DRINKS,
                isAvailable = true,
                preparationTime = 3,
                isFeatured = true
            ),

            // COFFEE COCKTAILS CATEGORY
            MenuItem(
                id = "salted-caramel-macchiato",
                name = "Salted Caramel Espresso Macchiato",
                description = "Double espresso, a bit of milk, real salted caramel (FG)",
                basePrice = 7.25,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.COFFEE_COCKTAILS,
                isAvailable = true,
                preparationTime = 7,
                isFeatured = true,
                allergens = listOf("F", "G")
            ),
            MenuItem(
                id = "cappuccino-marshmallow",
                name = "Cappuccino Marshmallow Fluff",
                description = "Cappuccino topped with fluffy marshmallow",
                basePrice = 7.25,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.COFFEE_COCKTAILS,
                isAvailable = true,
                preparationTime = 6,
                allergens = listOf("G")
            ),
            MenuItem(
                id = "honey-latte-macchiato",
                name = "Honey Latte Macchiato",
                description = "Single shot, lots of milk, honey syrup (FG)",
                basePrice = 7.25,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.COFFEE_COCKTAILS,
                isAvailable = true,
                preparationTime = 6,
                allergens = listOf("F", "G")
            ),
            MenuItem(
                id = "orangeccino",
                name = "Orangeccino",
                description = "Double espresso with fresh-pressed orange juice",
                basePrice = 8.25,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.COFFEE_COCKTAILS,
                isAvailable = true,
                preparationTime = 8,
                isFeatured = true
            ),
            MenuItem(
                id = "kaffee-latte-oreo",
                name = "Kaffee Latte with Oreo",
                description = "Single shot, lots of milk, Oreo cookies (FGCA)",
                basePrice = 8.25,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.COFFEE_COCKTAILS,
                isAvailable = true,
                preparationTime = 7,
                allergens = listOf("F", "G", "C", "A")
            ),

            // SIGNATURE WAFFOLINO ITEMS
            MenuItem(
                id = "waffolino",
                name = "Waffolino",
                description = "Single espresso & foamed milk in a waffle cone (FCGA)",
                basePrice = 11.25,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.COFFEE_COCKTAILS,
                isAvailable = true,
                preparationTime = 10,
                isFeatured = true,
                isPopular = true,
                allergens = listOf("F", "C", "G", "A")
            ),
            MenuItem(
                id = "waffolino-pistacchio",
                name = "Waffolino con Pistacchio",
                description = "Single espresso & foamed milk in a pistachio waffle cone (FCGA)",
                basePrice = 14.75,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.COFFEE_COCKTAILS,
                isAvailable = true,
                preparationTime = 12,
                isFeatured = true,
                allergens = listOf("F", "C", "G", "A")
            ),

            // SUMMER DRINKS
            MenuItem(
                id = "espresso-tonic",
                name = "Espresso-Tonic",
                description = "Double espresso + bottle of Fever-Tree tonic (no alcohol)",
                basePrice = 10.00,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.SUMMER_DRINKS,
                isAvailable = true,
                preparationTime = 5,
                isFeatured = true
            ),
            MenuItem(
                id = "affogato",
                name = "Affogato",
                description = "One scoop creamy ice cream + double espresso",
                basePrice = 7.75,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.SUMMER_DRINKS,
                isAvailable = true,
                preparationTime = 5,
                isPopular = true,
                allergens = listOf("G")
            ),
            MenuItem(
                id = "waffolino-affogato",
                name = "Waffolino Affogato",
                description = "Double espresso, a scoop of ice cream in a waffle cone",
                basePrice = 13.50,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.SUMMER_DRINKS,
                isAvailable = true,
                preparationTime = 10,
                isFeatured = true,
                allergens = listOf("F", "C", "G", "A")
            ),

            // SOFT SERVE
            MenuItem(
                id = "soft-serve-vanilla",
                name = "Soft Serve Ice Cream",
                description = "ONLY VANILLA, the best Vanilla ice cream you can find in Town!",
                basePrice = 6.00,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.SOFT_SERVE,
                isAvailable = true,
                preparationTime = 3,
                isPopular = true,
                allergens = listOf("G")
            ),

            // OTHER ITEMS
            MenuItem(
                id = "extra-espresso-shot",
                name = "Extra Espresso Shot",
                description = "(to each coffee drink)",
                basePrice = 1.75,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.OTHER,
                isAvailable = true,
                preparationTime = 1,
                isCustomizable = false
            ),
            MenuItem(
                id = "hot-chocolate-small",
                name = "Hot Chocolate — Small",
                description = "Rich, creamy hot chocolate",
                basePrice = 4.68,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.OTHER,
                isAvailable = true,
                preparationTime = 4,
                allergens = listOf("G")
            ),
            MenuItem(
                id = "hot-chocolate-large",
                name = "Hot Chocolate — Large",
                description = "Rich, creamy hot chocolate, large size",
                basePrice = 6.00,
                imageUrl = null, // Use coffee_cup drawable as fallback
                category = MenuCategory.OTHER,
                isAvailable = true,
                preparationTime = 4,
                allergens = listOf("G")
            )
        )
    }
}

@Parcelize
@Serializable
enum class MenuCategory(val displayName: String, val iconName: String) : Parcelable {
    ALL("ALL", "all"),
    VIENNA_CLASSICS("VIENNA CLASSICS", "vienna_classics"),
    SPECIALTY_ETHIOPIA("Specialty / Ethiopia", "specialty_ethiopia"),
    COFFEE_COCKTAILS("Coffee Cocktails", "coffee_cocktails"),
    SUMMER_DRINKS("Summer Drinks", "summer_drinks"),
    SOFT_SERVE("Soft serve", "soft_serve"),
    OTHER("Other", "other");

    companion object {
        fun fromString(value: String): MenuCategory {
            return values().find { it.name.equals(value, ignoreCase = true) } ?: ALL
        }
    }
}

@Parcelize
@Serializable
data class MenuModifier(
    val id: String,
    val name: String,
    val type: ModifierType,
    val isRequired: Boolean = false,
    val options: List<ModifierOption> = emptyList(),
    val maxSelections: Int = 1
) : Parcelable

@Parcelize
@Serializable
enum class ModifierType : Parcelable {
    SINGLE_SELECT,
    MULTI_SELECT,
    QUANTITY
}

@Parcelize
@Serializable
data class ModifierOption(
    val id: String,
    val name: String,
    val priceAdjustment: Double = 0.0,
    val isAvailable: Boolean = true
) : Parcelable {
    
    val formattedPriceAdjustment: String
        get() = when {
            priceAdjustment > 0 -> "+$${String.format("%.2f", priceAdjustment)}"
            priceAdjustment < 0 -> "-$${String.format("%.2f", -priceAdjustment)}"
            else -> ""
        }
}

@Parcelize
@Serializable
data class NutritionInfo(
    val calories: Int,
    val fat: Double, // grams
    val saturatedFat: Double, // grams
    val cholesterol: Int, // mg
    val sodium: Int, // mg
    val carbohydrates: Double, // grams
    val fiber: Double, // grams
    val sugar: Double, // grams
    val protein: Double, // grams
    val caffeine: Int // mg
) : Parcelable

@Parcelize
@Serializable
data class SelectedModifier(
    val modifierId: String,
    val optionId: String,
    val quantity: Int = 1
) : Parcelable
