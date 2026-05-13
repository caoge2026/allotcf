package com.allotcf.repository;

import com.allotcf.entity.SpeakingScenario;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpeakingScenarioRepository extends JpaRepository<SpeakingScenario, Long> {

    List<SpeakingScenario> findAllByOrderByIdAsc();
}
