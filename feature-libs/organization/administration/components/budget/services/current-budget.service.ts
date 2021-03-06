import { Injectable } from '@angular/core';
import { RoutingService } from '@spartacus/core';
import {
  Budget,
  BudgetService,
} from '@spartacus/organization/administration/core';
import { Observable } from 'rxjs';
import { ROUTE_PARAMS } from '../../constants';
import { CurrentItemService } from '../../shared/current-item.service';

@Injectable({
  providedIn: 'root',
})
export class CurrentBudgetService extends CurrentItemService<Budget> {
  constructor(
    protected routingService: RoutingService,
    protected budgetService: BudgetService
  ) {
    super(routingService);
  }

  protected getDetailsRoute(): string {
    return 'budgetDetails';
  }

  protected getParamKey() {
    return ROUTE_PARAMS.budgetCode;
  }

  protected getItem(code: string): Observable<Budget> {
    return <any>(<Budget>this.budgetService.get(code));
  }

  getError(code: string): Observable<boolean> {
    return this.budgetService.getErrorState(code);
  }
}
