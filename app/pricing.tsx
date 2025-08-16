import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

type PricingPlan = "free" | "pro" | "premium";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: PricingPlan;
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  color: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Explorer",
    price: "Free",
    period: "forever",
    description: "Perfect for casual plant enthusiasts",
    color: "#6B7280",
    features: [
      { text: "5 plant identifications per day", included: true },
      { text: "Basic plant information", included: true },
      { text: "Personal plant sightings", included: true },
      { text: "Location mapping", included: true },
      { text: "1 private tour", included: true },
      { text: "AI-powered identification", included: false },
      { text: "Unlimited identifications", included: false },
      { text: "Advanced plant profiles", included: false },
      { text: "Unlimited tours", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Botanist",
    price: "$4.99",
    period: "per month",
    description: "For serious plant lovers and gardeners",
    color: "#22C55E",
    popular: true,
    features: [
      { text: "Unlimited plant identifications", included: true },
      { text: "AI-powered identification", included: true },
      { text: "Advanced plant profiles", included: true },
      { text: "Care instructions & tips", included: true },
      { text: "Unlimited private tours", included: true },
      { text: "5 public tours", included: true },
      { text: "Export plant data", included: true },
      { text: "Offline plant database", included: false },
      { text: "Priority support", included: false },
      { text: "Custom plant collections", included: false },
    ],
  },
  {
    id: "premium",
    name: "Naturalist",
    price: "$9.99",
    period: "per month",
    description: "For professionals and educators",
    color: "#8B5CF6",
    features: [
      { text: "Everything in Botanist", included: true },
      { text: "Offline plant database", included: true },
      { text: "Unlimited public tours", included: true },
      { text: "Custom plant collections", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Priority support", included: true },
      { text: "API access", included: true },
      { text: "White-label options", included: true },
      { text: "Team collaboration", included: true },
      { text: "Educational resources", included: true },
    ],
  },
];

export default function PricingScreen() {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>("pro");
  const [isAnnual, setIsAnnual] = useState(false);

  const handlePlanSelect = (planId: PricingPlan) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPlan(planId);
  };

  const handleSubscribe = (plan: Plan) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (plan.id === "free") {
      Alert.alert(
        "Free Plan Selected! 🌱",
        "You can start exploring PlantMapper with the free plan. Upgrade anytime for more features.",
        [{ text: "Get Started", onPress: () => router.replace("/(tabs)") }]
      );
    } else {
      Alert.alert(
        "Coming Soon! 🚀",
        `${plan.name} plan subscription will be available soon. For now, enjoy the free plan with demo features.`,
        [
          { text: "Try Free Plan", onPress: () => router.replace("/(tabs)") },
          { text: "Notify Me", style: "default" },
        ]
      );
    }
  };

  const getAnnualPrice = (monthlyPrice: string) => {
    if (monthlyPrice === "Free") return "Free";
    const monthly = parseFloat(monthlyPrice.replace("$", ""));
    const annual = monthly * 10; // 2 months free
    return `$${annual.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Choose Your Plan</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Billing Toggle */}
        <View style={styles.billingToggle}>
          <Text style={[styles.billingText, !isAnnual && styles.billingTextActive]}>
            Monthly
          </Text>
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setIsAnnual(!isAnnual)}
          >
            <View style={[styles.toggle, isAnnual && styles.toggleActive]}>
              <View style={[styles.toggleThumb, isAnnual && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
          <View style={styles.annualContainer}>
            <Text style={[styles.billingText, isAnnual && styles.billingTextActive]}>
              Annual
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>Save 17%</Text>
            </View>
          </View>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => handlePlanSelect(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.planPrice, { color: plan.color }]}>
                    {isAnnual ? getAnnualPrice(plan.price) : plan.price}
                  </Text>
                  <Text style={styles.planPeriod}>
                    {plan.price === "Free" ? plan.period : isAnnual ? "per year" : plan.period}
                  </Text>
                </View>
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons
                      name={feature.included ? "checkmark-circle" : "close-circle"}
                      size={16}
                      color={feature.included ? plan.color : "#D1D5DB"}
                    />
                    <Text
                      style={[
                        styles.featureText,
                        !feature.included && styles.featureTextDisabled,
                      ]}
                    >
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  { backgroundColor: plan.color },
                  selectedPlan === plan.id && styles.subscribeButtonSelected,
                ]}
                onPress={() => handleSubscribe(plan)}
              >
                <Text style={styles.subscribeButtonText}>
                  {plan.id === "free" ? "Get Started" : "Subscribe"}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I change plans anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes! You can upgrade, downgrade, or cancel your subscription at any time from your profile settings.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What happens to my data if I downgrade?</Text>
            <Text style={styles.faqAnswer}>
              Your plant sightings and tours are always saved. Some premium features may become read-only until you upgrade again.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is there a free trial?</Text>
            <Text style={styles.faqAnswer}>
              The Explorer plan is free forever! You can also try premium features with our demo mode before subscribing.
            </Text>
          </View>
        </View>

        {/* Trust Indicators */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={24} color="#22C55E" />
            <Text style={styles.trustText}>Secure payments</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="refresh" size={24} color="#22C55E" />
            <Text style={styles.trustText}>Cancel anytime</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="people" size={24} color="#22C55E" />
            <Text style={styles.trustText}>Join 10k+ users</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  billingToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  billingText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  billingTextActive: {
    color: "#111827",
    fontWeight: "600",
  },
  toggleContainer: {
    marginHorizontal: 16,
  },
  toggle: {
    width: 48,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D1D5DB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "#22C55E",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  annualContainer: {
    alignItems: "center",
  },
  saveBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  saveText: {
    fontSize: 10,
    color: "#D97706",
    fontWeight: "600",
  },
  plansContainer: {
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  planCardSelected: {
    borderColor: "#22C55E",
    transform: [{ scale: 1.02 }],
  },
  planCardPopular: {
    borderColor: "#22C55E",
  },
  popularBadge: {
    position: "absolute",
    top: -8,
    left: 24,
    right: 24,
    backgroundColor: "#22C55E",
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
  },
  popularText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  planHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  planName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: "bold",
  },
  planPeriod: {
    fontSize: 14,
    color: "#6B7280",
  },
  planDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  featureTextDisabled: {
    color: "#9CA3AF",
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  subscribeButtonSelected: {
    transform: [{ scale: 1.05 }],
  },
  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  faqSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  trustSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  trustItem: {
    alignItems: "center",
    gap: 8,
  },
  trustText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});