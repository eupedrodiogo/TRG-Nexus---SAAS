import { AppView, TherapistPlan } from 'types';
// import { PLAN_FEATURES } from '../config/planConfig';

interface PlanAccessHook {
    plan: TherapistPlan;
    planLabel: string;
    hasAccess: (view: AppView) => boolean;
    getAvailableViews: () => AppView[];
    isRestricted: (view: AppView) => boolean;
    getRestrictedViews: () => AppView[];
}

export const usePlanAccess = (): PlanAccessHook => {
    // STUBBED FOR DEBUGGING REFERENCE ERROR
    const hasAccess = (view: AppView): boolean => {
        return true;
    };

    const getAvailableViews = (): AppView[] => {
        return Object.values(AppView);
    };

    const isRestricted = (view: AppView): boolean => {
        return false;
    };

    const getRestrictedViews = (): AppView[] => {
        return [];
    };

    return {
        plan: TherapistPlan.PROFISSIONAL,
        planLabel: 'Profissional',
        hasAccess,
        getAvailableViews,
        isRestricted,
        getRestrictedViews,
    };
};

export default usePlanAccess;
